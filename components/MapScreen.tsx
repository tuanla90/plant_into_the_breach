
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapNode, Unit, UnitType, UnitClass, UnitDefinition, WorldType } from '../types';
import { WORLD_META } from '../data/worlds';
import { Skull, Swords, Tent, Crown, HelpCircle, Sun, ShoppingBag, Map as MapIcon, Check, Crosshair, ZoomIn, ZoomOut, Users, X, Info, Bug, Library, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

// --- CONFIGURATION & HELPERS ---

const NODE_INFO: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string; border: string; bg: string }> = {
    // Legend order = insertion order (the panel renders Object.entries directly), and it
    // is deliberately curiosity-first / danger-last: event, rest, shop, then the three
    // fight tiers in ascending threat. The old order led with combat, which put the two
    // scariest symbols on top of the list a brand-new player reads first.
    'EVENT': {
        label: 'Unknown Signal', desc: 'Random event.',
        icon: <HelpCircle size={20} />,
        // Cyan/Blue
        color: 'text-cyan-300', border: 'border-cyan-400', bg: 'bg-cyan-950'
    },
    'CAMPFIRE': {
        label: 'Rest Site', desc: 'Rest, Heal, or Train.',
        icon: <Tent size={20} />,
        // Changed to GREEN (Safety/Recovery)
        color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950'
    },
    'SHOP': {
        label: 'Supply Depot', desc: 'Spend Sun on items.',
        icon: <ShoppingBag size={20} />,
        // Gold/Yellow
        color: 'text-yellow-300', border: 'border-yellow-400', bg: 'bg-yellow-900'
    },
    'BATTLE': {
        label: 'Skirmish', desc: 'Standard combat. Moderate rewards.',
        icon: <Swords size={20} />,
        // Changed to lighter metallic look for visibility
        color: 'text-gray-200', border: 'border-gray-400', bg: 'bg-zinc-800'
    },
    'ELITE': {
        label: 'Elite Threat', desc: 'High danger. Rare loot.',
        icon: <Skull size={20} />,
        // Changed to ORANGE (Danger level 2)
        color: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-950'
    },
    'BOSS': {
        label: 'Sector Boss', desc: 'Final objective. Extreme danger.',
        icon: <Crown size={24} />,
        // Changed to RED (Extreme Danger)
        color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-950'
    },
};

interface MapScreenProps {
  nodes: MapNode[];
  onSelectNode: (node: MapNode) => void;
  /** Dev travel mode: every node is enterable, branch gating is off. */
  debugMode?: boolean;
  onToggleDebug?: () => void;
  /** Pin the legend open from outside (the opening dialogue explains the symbols). */
  forceLegend?: boolean;
  /** Node types the current dialogue line is describing; those rows are lit, the rest recede. */
  highlightLegend?: string[];
  /** Dev wallet top-up, so a jumped-to Shop is actually testable. */
  onDebugGrant?: () => void;
  /** Dev: burn a brain, so the buy-back is reachable without playing a losing map. */
  onDebugLoseBrain?: () => void;
  units: Unit[];
  sun: number;
  unitDefs: Record<UnitClass, UnitDefinition>;
  onUpgradeUnit: (unitId: string, stat: 'HP' | 'DMG' | 'MOVE' | 'CDR') => void;
  onEvolveUnit: (unitId: string, targetClass: UnitClass) => void;
  /** Opens the heroes-and-fusions reference. Mid-run it answers "is this plant worth buying". */
  onOpenCodex?: () => void;
  onOpenSettings?: () => void;
}

// --- SUB-COMPONENTS ---

const NodeTooltip = ({ type, x, y, zoom }: { type: string, x: number, y: number, zoom: number }) => {
    const { t } = useI18n();
    const info = NODE_INFO[type] || NODE_INFO['EVENT'];
    // Flip to the node's left past mid-map and clamp top/bottom: anchored blindly to the
    // right, a 224px card walked off the canvas for every node in the two rightmost
    // columns (and poked past the edges for nodes on the first/last row).
    const flip = x > 55;
    return (
        <div
            className="absolute z-50 bg-[#1a1c21] border-2 border-white/20 p-3 rounded shadow-[0_0_30px_rgba(0,0,0,0.9)] flex flex-col gap-1 w-56 pointer-events-none transition-opacity duration-200"
            style={{
                left: `${x}%`,
                top: `clamp(3.5rem, ${y}%, calc(100% - 3.5rem))`,
                transform: flip ? `translate(calc(-100% - 20px), -50%) scale(${1/zoom})` : `translate(20px, -50%) scale(${1/zoom})`,
                transformOrigin: flip ? 'right center' : 'left center'
            }}
        >
            <div className={`font-black uppercase text-sm ${info.color} flex items-center gap-2 border-b border-white/10 pb-1`}>
                {info.icon} {t(info.label)}
            </div>
            <div className="text-sm text-gray-300 leading-snug">{t(info.desc)}</div>
        </div>
    );
};

export const MapScreen: React.FC<MapScreenProps> = ({ nodes, onSelectNode, units, sun, unitDefs, onUpgradeUnit, onEvolveUnit, debugMode = false, onToggleDebug, onDebugGrant, onDebugLoseBrain, forceLegend = false, highlightLegend, onOpenCodex, onOpenSettings }) => {
  const { t } = useI18n();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // UX State
  const [zoom, setZoom] = useState(0.8);
  const [showLegend, setShowLegend] = useState(false);
  // Held open from outside while the opening dialogue explains the symbols. That script
  // names five icons in a row, and reading them off a panel the player has to go find and
  // open for themselves is exactly the instruction nobody follows.
  const legendOpen = forceLegend || showLegend;
  const [showSquadModal, setShowSquadModal] = useState(false);

  const MAP_HEIGHT_BASE = 1800;

  /**
   * ĐIỆN THOẠI CẦM NGANG: bản đồ chạy NGANG (xuất phát trái → trùm phải).
   *
   * Bản đồ leo-từ-đáy-lên hợp màn cao; trên viewport ~375px cao nó bắt người chơi
   * cuộn dọc liên tục qua một khe nhìn mỏng. Xoay trục cho khớp chiều màn hình:
   * dữ liệu node giữ nguyên (x = làn, y = tiến độ, y lớn = điểm xuất phát),
   * chỉ TOẠ ĐỘ VẼ đổi qua mapPos() — mọi thứ (node, cạnh nối, tooltip, band,
   * auto-scroll) đều đi qua một chỗ đó. Desktop và màn dọc không đổi.
   */
  const [horizontal, setHorizontal] = useState(
      () => typeof window !== 'undefined'
          && window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches
  );
  useEffect(() => {
      const mq = window.matchMedia('(orientation: landscape) and (max-height: 520px)');
      const onChange = () => setHorizontal(mq.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
  }, []);
  /** Toạ độ dữ liệu → toạ độ vẽ (%). Ngang: trục tiến độ lật để xuất phát nằm bên trái. */
  const mapPos = (n: { x: number; y: number }) =>
      horizontal ? { x: 100 - n.y, y: n.x } : { x: n.x, y: n.y };

  /**
   * THE SECTORS THIS RUN WALKS, as bands down the page.
   *
   * Read off the nodes rather than passed in, because the nodes are the only thing that knows:
   * `sectorForLayer` stamped a world onto each one when the map was generated, and a stage is
   * exactly which three it stamped. Deriving it means the Breach's nine-sector gauntlet gets
   * banded correctly without this component learning what the Breach is.
   *
   * Each band runs to the MIDPOINT between its last node and the next band's first, so the
   * border falls in the gap between two layers rather than through a node — a boundary drawn
   * across the middle of a battle icon reads as a glitch, not a border.
   */
  const bands = useMemo(() => {
      const extent = new Map<WorldType, { min: number; max: number }>();
      nodes.forEach(n => {
          const cur = extent.get(n.world);
          if (!cur) extent.set(n.world, { min: n.y, max: n.y });
          else { cur.min = Math.min(cur.min, n.y); cur.max = Math.max(cur.max, n.y); }
      });
      const ordered = [...extent.entries()]
          .map(([world, e]) => ({ world, ...e }))
          .sort((a, b) => a.min - b.min);
      return ordered.map((b, i) => ({
          world: b.world,
          index: i,
          labelAt: b.min,
          top: i === 0 ? 0 : (ordered[i - 1].max + b.min) / 2,
          bottom: i === ordered.length - 1 ? 100 : (b.max + ordered[i + 1].min) / 2,
      }));
  }, [nodes]);

  /**
   * Where the player actually is: the node they may enter next, or the last one they cleared.
   * The title bar used to be the literal string "Sector 1: Grasslands" no matter what, which
   * is a label that is wrong more often than it is right — two thirds of every run, and all of
   * stages II and III.
   */
  const here = useMemo(() => {
      const open = nodes.find(n => n.status === 'AVAILABLE');
      if (open) return open;
      const done = nodes.filter(n => n.status === 'COMPLETED').sort((a, b) => b.y - a.y)[0];
      return done ?? nodes[0];
  }, [nodes]);
  const hereBand = bands.find(b => b.world === here?.world);
  const hereMeta = here ? WORLD_META[here.world] : undefined;

  // AUTO SCROLL
  useEffect(() => {
    if (scrollRef.current && !hasScrolledRef.current) {
        centerOnActiveNode();
        hasScrolledRef.current = true;
    }
  }, [nodes]);

  const centerOnActiveNode = () => {
      if (!scrollRef.current) return;
      const activeNode = nodes.find(n => n.status === 'AVAILABLE');
      if (activeNode) {
           const pos = mapPos(activeNode);
           if (horizontal) {
               const scrollX = (pos.x / 100) * (MAP_HEIGHT_BASE * zoom);
               scrollRef.current.scrollTo({
                   left: scrollX - (scrollRef.current.clientWidth / 2),
                   behavior: 'smooth'
               });
           } else {
               const scrollY = (pos.y / 100) * (MAP_HEIGHT_BASE * zoom);
               scrollRef.current.scrollTo({
                   top: scrollY - (scrollRef.current.clientHeight / 2),
                   behavior: 'smooth'
               });
           }
      } else {
           scrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
  };

  const handleZoom = (delta: number) => {
      setZoom(prev => {
          const next = Math.max(0.4, Math.min(1.5, prev + delta));
          return next;
      });
  };

  const getStatusClasses = (status: string, type: string) => {
    // 1. COMPLETED: Grayed out, historical
    if (status === 'COMPLETED') return 'bg-gray-800 text-gray-500 border-gray-600 grayscale brightness-50';

    // 2. SKIPPED: Very dark, barely visible
    if (status === 'SKIPPED') return 'bg-[#050505] text-[#222] border-[#222] grayscale opacity-20 pointer-events-none';

    // 3. LOCKED (Future nodes):
    // KEY CHANGE: Removed 'grayscale'. Now shows true color but dimmed/transparent.
    // This allows player to plan route based on color (Red=Boss, Green=Heal)
    if (status === 'LOCKED') {
        const info = NODE_INFO[type] || NODE_INFO['BATTLE'];
        return `${info.bg} ${info.border} ${info.color} opacity-60 brightness-75 pointer-events-none border-dashed`;
    }

    // 4. AVAILABLE (Active nodes):
    // Full brightness, pulsing glow
    const info = NODE_INFO[type] || NODE_INFO['BATTLE'];
    return `${info.bg} ${info.border} ${info.color} cursor-pointer hover:scale-110 hover:brightness-110 shadow-[0_0_20px_rgba(255,255,255,0.2)] z-10 ring-2 ring-offset-2 ring-offset-black ring-white/20`;
  };

  const renderConnections = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        {nodes.map(node => (
            node.next.map(nextId => {
                const nextNode = nodes.find(n => n.id === nextId);
                if (!nextNode) return null;

                const isPathActive = node.status === 'COMPLETED' && nextNode.status === 'AVAILABLE';
                const isPathTaken = node.status === 'COMPLETED' && nextNode.status === 'COMPLETED';

                // --- COLOR IMPROVEMENTS ---
                let stroke = "#52525b"; // Zinc-600 (More visible gray for unconnected)
                let width = "2";
                let dash = "5,5";
                let opacity = "0.6";

                if (isPathTaken) {
                    stroke = "#fbbf24"; // Amber-400 (Gold for history)
                    width = "4";
                    dash = "none";
                    opacity = "0.8";
                } else if (isPathActive) {
                    stroke = "#4ade80"; // Bright Green for available paths
                    width = "3";
                    dash = "none";
                    opacity = "1";
                }

                const a = mapPos(node);
                const b = mapPos(nextNode);
                return (
                    <line
                        key={`${node.id}-${nextId}`}
                        x1={`${a.x}%`} y1={`${a.y}%`}
                        x2={`${b.x}%`} y2={`${b.y}%`}
                        stroke={stroke}
                        strokeWidth={width}
                        strokeDasharray={dash}
                        opacity={opacity}
                        className={isPathActive ? "animate-[pulse_1.5s_infinite]" : ""}
                        filter={isPathActive ? "url(#glow)" : ""}
                    />
                );
            })
        ))}
    </svg>
  );

  const playerUnits = units.filter(u => u.type === UnitType.PLANT);

  /**
   * Legend rows. Shared by both mountings below, so the panel the tutorial lifts is
   * literally the same list the player opens by hand.
   */
  const legendBody = (
      <>
          <div className="text-sm uppercase font-bold text-gray-500 border-b border-gray-700 pb-2 mb-1">{t('Map Legend')}</div>
          {/* Màn thấp (điện thoại ngang): một cột 8 mục cao hơn cả viewport — trải
              thành lưới 3 cột; panel bọc ngoài cũng nới rộng theo (short:w-...). */}
          <div className="flex flex-col gap-3 short:grid short:grid-cols-3 short:gap-2">
          {Object.entries(NODE_INFO).map(([key, info]) => {
              // No list at all means every row reads normally. A list means the rows it does
              // NOT name recede, so the eye lands on the symbol being talked about right now.
              const named = !!highlightLegend?.includes(key);
              const dimmed = !!highlightLegend?.length && !named;
              return (
                  <div key={key}
                       className={`flex items-start gap-3 short:gap-2 rounded p-1 transition-all duration-300
                           ${dimmed ? 'opacity-40' : 'opacity-100'}
                           ${named ? 'bg-white/10 ring-1 ring-white/30' : ''}`}>
                      <div className={`p-1 rounded shrink-0 ${info.bg} border ${info.border} ${info.color}`}>
                          {info.icon}
                      </div>
                      <div className="min-w-0">
                          <div className={`text-sm font-bold ${info.color}`}>{t(info.label)}</div>
                          <div className="text-xs text-gray-400 leading-tight">{t(info.desc)}</div>
                      </div>
                  </div>
              );
          })}
          </div>
      </>
  );

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col font-pixel text-white relative overflow-hidden">

        {debugMode && (
            <div className="absolute top-14 left-0 right-0 z-30 bg-fuchsia-950/90 border-b border-fuchsia-500 px-6 py-2 flex items-center justify-between text-xs uppercase tracking-widest">
                <span className="text-fuchsia-300 flex items-center gap-2">
                    <Bug size={14} /> {t('Dev travel on — click any node. Nothing is consumed.')}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onDebugGrant}
                        className="px-3 py-1 border border-fuchsia-500 text-fuchsia-200 hover:bg-fuchsia-900 font-bold"
                    >
                        {t('+500 Coin')}
                    </button>
                    <button
                        onClick={onDebugLoseBrain}
                        className="px-3 py-1 border border-fuchsia-500 text-fuchsia-200 hover:bg-fuchsia-900 font-bold"
                    >
                        {t('-1 Brain')}
                    </button>
                </div>
            </div>
        )}

        {/*
          LEGEND, LIFTED. While a tutorial dialogue is pinning the legend open it is being
          READ, and it cannot be read through the dialogue's black/75 veil.

          A z-index alone cannot fix that: the toolbar below is a flex item carrying `z-20`,
          which makes it a stacking context, so the dropdown's `z-50` is only ever "50 within
          a box painted at 20" — no number gets it past an overlay at 70. The panel has to
          leave the toolbar's subtree entirely, which is what this portal does.

          `pointer-events-none` is load-bearing: the dialogue underneath advances on a click
          anywhere, and a panel that swallowed those clicks would read as a frozen game.
        */}
        {legendOpen && forceLegend && createPortal(
            <div className="fixed top-[4.5rem] right-6 w-64 short:w-[min(44rem,calc(100vw-3rem))] z-[80] pointer-events-none
                            bg-[#1a1c21] border border-gray-500 rounded p-4 short:p-3 flex flex-col gap-3
                            shadow-[0_0_40px_rgba(0,0,0,0.95)] ring-1 ring-white/10
                            animate-in fade-in slide-in-from-top-2 duration-200">
                {legendBody}
            </div>,
            document.body,
        )}

        {/* --- MAP TOOLBAR ---
             Màn DỌC: cho xuống hàng. Cụm bên phải chở bảy thứ và đo được 401px; trên màn
             390px nó bắt đầu ở x=117 nên hai nút cuối — CÀI ĐẶT và ĐỘI HÌNH — nằm hẳn ngoài
             mép phải và KHÔNG CÁCH NÀO BẤM ĐƯỢC. (Nút debug chỉ có ở bản dev, nên bản phát
             hành vẫn mất nguyên nút Đội Hình.) Đây đúng khuôn `portrait:flex-wrap` mà HUD
             trong trận đã dùng cho cùng một bài toán: thà cao thêm một hàng còn hơn mất nút. */}
        <div className="h-14 portrait:h-auto portrait:flex-wrap portrait:justify-center portrait:gap-y-1.5 portrait:py-1.5
                        bg-[#111] border-b border-[#333] flex items-center justify-between px-6 portrait:px-2 z-20 shrink-0 shadow-lg">
             <div className="flex items-center gap-4">
                 <MapIcon className="text-green-500" />
                 <div>
                     <h1 className="text-lg font-bold uppercase tracking-widest leading-none"
                         style={{ color: hereMeta?.accent ?? '#ffffff' }}>
                         {hereMeta
                             ? t('Sector {n}: {name}', { n: (hereBand?.index ?? 0) + 1, name: t(hereMeta.name) })
                             : t('Operation: Blightfall')}
                     </h1>
                     <span className="text-xs text-gray-500 uppercase">{t('Operation: Blightfall')}</span>
                 </div>
             </div>

             {/* gap-1.5 khi cầm dọc: bảy nút với khoảng cách của desktop là 398px trong khung
                 390px — vẫn thừa ra 6px ở phải và 2px ở trái ngay cả sau khi đã cho xuống
                 hàng. Thu khoảng cách là chỗ rẻ nhất để lấy lại 29px đó. */}
             <div className="flex items-center gap-3 portrait:gap-1.5">
                 {/* Zoom Controls */}
                 <div className="bg-black/50 border border-gray-700 rounded-md flex items-center p-1">
                     <button onClick={() => handleZoom(-0.2)} className="p-1 min-w-[40px] min-h-[40px] flex items-center justify-center hover:text-white text-gray-400 hover:bg-gray-700 rounded" title={t('Zoom Out')}><ZoomOut size={18}/></button>
                     <span className="text-xs w-12 portrait:w-8 text-center font-mono text-gray-300 select-none">{Math.round(zoom * 100)}%</span>
                     <button onClick={() => handleZoom(0.2)} className="p-1 min-w-[40px] min-h-[40px] flex items-center justify-center hover:text-white text-gray-400 hover:bg-gray-700 rounded" title={t('Zoom In')}><ZoomIn size={18}/></button>
                 </div>

                 {/* Dev Travel */}
                 <button
                    onClick={onToggleDebug}
                    title={t('Dev travel: enter any node, no branch is consumed. Shortcut: Ctrl+Shift+D')}
                    className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border rounded transition-colors ${debugMode
                        ? 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-500'
                        : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                 >
                     <Bug size={18} />
                 </button>

                 {/* Center View */}
                 <button onClick={centerOnActiveNode} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-gray-700 hover:border-gray-500 hover:bg-gray-800 rounded text-gray-400 hover:text-white" title={t('Center View')}>
                     <Crosshair size={18} />
                 </button>

                 {/* Legend Toggle */}
                 <div className="relative">
                     <button
                        onClick={() => setShowLegend(!showLegend)}
                        className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border rounded transition-colors ${legendOpen ? 'bg-blue-900/30 text-blue-400 border-blue-600' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        title={t('Map Legend')}
                     >
                         <HelpCircle size={18} />
                     </button>

                     {/* LEGEND DROPDOWN — anchored to the button during normal play. */}
                     {legendOpen && !forceLegend && (
                         <div className="absolute top-12 right-0 w-64 short:w-[min(44rem,calc(100vw-3rem))] short:max-h-[calc(100dvh-6rem)] short:overflow-y-auto bg-[#1a1c21] border border-gray-600 shadow-2xl rounded p-4 short:p-3 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                             {legendBody}
                         </div>
                     )}
                 </div>

                 {/* The Archive — read-only, so it is safe to open at any point on the map.
                     Opens on the fusion matrix: mid-run the question is which pairings are
                     still missing, not how pushing works. */}
                 {onOpenCodex && (
                     <button
                        onClick={onOpenCodex}
                        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-gray-700 hover:border-gray-500 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                        title={t('Tactical Archive')}
                     >
                         <Library size={18} />
                     </button>
                 )}

                  {/* SETTINGS MODAL TRIGGER */}
                  {onOpenSettings && (
                      <button
                         onClick={onOpenSettings}
                         className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-gray-700 hover:border-gray-500 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                         title={t('Cài Đặt')}
                      >
                          <Settings size={18} />
                      </button>
                  )}

                 {/* SQUAD MODAL TRIGGER */}
                 <button
                    onClick={() => setShowSquadModal(true)}
                    className="flex items-center justify-center gap-2 px-4 portrait:px-0 py-2 min-w-[40px] min-h-[40px] bg-green-900/30 border border-green-600 hover:bg-green-800/50 text-green-400 hover:text-white rounded transition-all uppercase font-bold text-sm tracking-wider"
                    title={t('View Squad')}
                 >
                     <Users size={18} /> <span className="portrait:hidden">{t('Squad')}</span>
                 </button>
             </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">

            {/* --- MAP AREA (FULL WIDTH) --- */}
            <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                {/* The dark floor every sector is painted on top of. The 50px grid that used to
                    sit here as well is gone: each sector brings its own texture now, and a
                    second grid underneath all of them was the thing making nine places look
                    like one. */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#141414_0%,#050505_100%)]"></div>

                <div
                    ref={scrollRef}
                    className="w-full h-full overflow-auto custom-scrollbar relative cursor-grab active:cursor-grabbing"
                >
                    {/* SCALABLE CONTAINER — trục dài chạy dọc (mặc định) hay ngang (điện
                        thoại cầm ngang) tuỳ `horizontal`; phần còn lại y nguyên. */}
                    <div
                        style={horizontal ? {
                            width: `${MAP_HEIGHT_BASE * zoom}px`,
                            height: '100%',
                            minHeight: '260px',
                            position: 'relative'
                        } : {
                            height: `${MAP_HEIGHT_BASE * zoom}px`,
                            width: '100%',
                            minWidth: '800px',
                            position: 'relative'
                        }}
                    >
                        {/* TRANSFORM WRAPPER */}
                        <div
                            style={horizontal ? {
                                width: `${MAP_HEIGHT_BASE}px`,
                                height: '100%',
                                transform: `scale(${zoom})`,
                                transformOrigin: 'left center',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            } : {
                                width: '100%',
                                height: `${MAP_HEIGHT_BASE}px`,
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top center',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                        >
                            {/* SECTOR BANDS. Inside the transform wrapper, not outside it, so a
                                band and the nodes standing in it zoom and scroll as one thing —
                                painted on the static frame they would slide off the layers they
                                are labelling the moment anybody dragged the map. */}
                            {bands.map(band => {
                                const meta = WORLD_META[band.world];
                                const hereNow = here?.world === band.world;
                                // Dải sector: dọc là băng ngang trang; NGANG là cột đứng —
                                // trục tiến độ đã lật (mapPos) nên mép "trên" của band thành
                                // mép PHẢI: left tính từ 100 - bottom.
                                const bandPos = horizontal
                                    ? { left: `${100 - band.bottom}%`, width: `${band.bottom - band.top}%`, top: 0, bottom: 0 }
                                    : { top: `${band.top}%`, height: `${band.bottom - band.top}%`, left: 0, right: 0 };
                                const fadeDeg = horizontal ? 90 : 180;
                                return (
                                    <div
                                        key={`${band.world}-${band.index}`}
                                        className="absolute pointer-events-none"
                                        style={bandPos}
                                    >
                                        <div className="absolute inset-0" style={{
                                            background: `linear-gradient(${fadeDeg}deg, ${meta.accent}00 0%, ${meta.accent}1f 18%, ${meta.accent}1f 82%, ${meta.accent}00 100%)`,
                                        }} />
                                        <div className="absolute inset-0" style={{
                                            backgroundImage: meta.texture,
                                            backgroundSize: meta.textureSize,
                                            // Faded at the seams for the same reason the tint is:
                                            // a hard edge between two textures reads as a UI
                                            // panel, and this is meant to read as ground.
                                            maskImage: `linear-gradient(${fadeDeg}deg, transparent 0%, black 16%, black 84%, transparent 100%)`,
                                            WebkitMaskImage: `linear-gradient(${fadeDeg}deg, transparent 0%, black 16%, black 84%, transparent 100%)`,
                                            opacity: hereNow ? 1 : 0.55,
                                        }} />
                                        {/* The name, at the band's own left margin. The title bar
                                            can only say where you are standing; this says where
                                            you are GOING, which is the question a branching map
                                            is asking. */}
                                        <span className="absolute left-3 top-3 flex items-center gap-2">
                                            <span className="w-8 h-[2px] rounded" style={{ background: meta.accent, opacity: hereNow ? 1 : 0.5 }} />
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em]"
                                                  style={{ color: meta.accent, opacity: hereNow ? 0.95 : 0.45 }}>
                                                {t(meta.name)}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}

                            {renderConnections()}

                            {nodes.map(node => {
                                const pos = mapPos(node);
                                return (
                                <React.Fragment key={node.id}>
                                    <button
                                        className={`
                                            absolute w-12 h-12 rounded-full border-[3px] flex items-center justify-center
                                            transition-all duration-200 z-10
                                            ${getStatusClasses(node.status, node.type)}
                                            ${debugMode && node.status !== 'AVAILABLE'
                                                ? 'grayscale-0 brightness-100 opacity-100 pointer-events-auto cursor-pointer ring-2 ring-fuchsia-500/70 ring-offset-1 ring-offset-black'
                                                : ''}
                                        `}
                                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                                        onClick={() => { if (debugMode || node.status === 'AVAILABLE') onSelectNode(node); }}
                                        onMouseEnter={() => setHoveredNodeId(node.id)}
                                        onMouseLeave={() => setHoveredNodeId(null)}
                                        disabled={!debugMode && node.status !== 'AVAILABLE'}
                                    >
                                        {node.status === 'COMPLETED' ? <Check size={20} className="text-green-500"/> :
                                        (React.cloneElement((NODE_INFO[node.type]?.icon || <HelpCircle />) as React.ReactElement<any>, { size: 20 }))}

                                        {/* Pulse Ring */}
                                        {node.status === 'AVAILABLE' && (
                                            <div className={`absolute inset-[-8px] border-2 rounded-full animate-ping opacity-50 ${NODE_INFO[node.type]?.border || 'border-white'}`}></div>
                                        )}
                                    </button>

                                    {/* Tooltip */}
                                    {hoveredNodeId === node.id && (
                                        <NodeTooltip type={node.type} x={pos.x} y={pos.y} zoom={zoom} />
                                    )}
                                </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FULL SCREEN SQUAD POPUP --- */}
            {showSquadModal && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in zoom-in-95 duration-200">

                    {/* MODAL HEADER */}
                    <div className="flex items-center justify-between p-6 border-b border-[#333] bg-[#1a1c21]">
                        <div className="flex items-center gap-6">
                            <h2 className="text-3xl text-white uppercase font-bold tracking-widest flex items-center gap-3">
                                <Users size={32} className="text-green-400" /> {t('Squad Status')}
                            </h2>
                            <div className="bg-yellow-900/20 px-4 py-2 rounded-full border border-yellow-600/50 flex items-center gap-3">
                                <Sun size={24} className="text-yellow-400 fill-yellow-500" />
                                <span className="text-2xl text-yellow-400 font-bold">{sun}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSquadModal(false)}
                            className="p-2 hover:bg-red-900/50 hover:text-red-400 rounded-full border border-transparent hover:border-red-500 transition-all"
                        >
                            <X size={32} />
                        </button>
                    </div>

                    {/* MODAL BODY */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#0d0e11]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                            {playerUnits.map(unit => {
                                const def = unitDefs[unit.class];
                                if (!def) return null;
                                const { maxStats, upgradeCosts, evolvesTo, evolutionCost } = def;

                                return (
                                <div key={unit.id} className="bg-[#1e2025] border-2 border-[#333] p-5 rounded-lg flex flex-col gap-4 hover:border-yellow-500 transition-all group shadow-lg">
                                    {/* Unit Header */}
                                    <div className="flex gap-4 items-center border-b border-gray-700 pb-4">
                                        <div className="w-16 h-16 bg-black border-2 border-gray-600 rounded flex items-center justify-center shrink-0 shadow-inner group-hover:border-yellow-400 transition-colors">
                                            <img src={unit.imgUrl} className="w-12 h-12 object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-lg font-bold text-white uppercase truncate">{t(def.name)}</span>
                                                <span className="text-xs text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded border border-blue-800">{t('Lv {level}', { level: unit.level })}</span>
                                            </div>
                                            <div className="text-sm text-gray-500 uppercase mt-1 tracking-wider">{t(unit.role)}</div>
                                        </div>
                                    </div>

                                    {/* Stats Upgrades */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs uppercase text-gray-500 font-bold">{t('Upgrades')}</span>
                                            <span className="text-xs text-yellow-500 flex items-center gap-1"><Sun size={10}/> {t('Cost')}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <StatButton
                                                label="HP" current={unit.maxHp} max={maxStats.hp} cost={upgradeCosts.hp}
                                                sun={sun} onClick={() => onUpgradeUnit(unit.id, 'HP')} color="red"
                                            />
                                            <StatButton
                                                label="DMG" current={unit.damage} max={maxStats.dmg} cost={upgradeCosts.dmg}
                                                sun={sun} onClick={() => onUpgradeUnit(unit.id, 'DMG')} color="yellow"
                                            />
                                        </div>
                                    </div>

                                    {/* Evolution */}
                                    {evolvesTo && evolvesTo.length > 0 && (
                                        <div className="mt-auto pt-4 border-t border-gray-700">
                                            <span className="text-xs uppercase text-gray-500 font-bold block mb-2">{t('Evolution')}</span>
                                            <div className="space-y-2">
                                                {evolvesTo.map(targetClass => (
                                                    <button
                                                        key={targetClass}
                                                        onClick={() => sun >= (evolutionCost || 9999) && onEvolveUnit(unit.id, targetClass)}
                                                        className={`w-full py-3 px-3 border rounded text-xs uppercase font-bold flex items-center justify-between transition-all
                                                            ${sun >= (evolutionCost || 9999)
                                                                ? 'bg-purple-900/30 border-purple-500 text-purple-200 hover:bg-purple-900/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                                                : 'bg-black/30 border-gray-700 text-gray-600 cursor-not-allowed'}
                                                        `}
                                                    >
                                                        <span className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div> {t('Evolve')}</span>
                                                        <span className="text-yellow-500">{evolutionCost} ☀️</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}

                            {/* Empty State */}
                            {playerUnits.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center text-gray-600 py-20">
                                    <Info size={48} className="mb-4 opacity-50"/>
                                    <p className="text-xl uppercase tracking-widest">{t('No Units in Squad')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        `}</style>
    </div>
  );
};

// --- Helper UI Components ---

const StatButton = ({ label, current, max, cost, sun, onClick, color }: any) => {
    const { t } = useI18n();
    const isMax = current >= max;
    const canAfford = sun >= cost;
    const colorClass = color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-yellow-400' : 'text-blue-400';

    return (
        <button
            onClick={onClick}
            disabled={!canAfford || isMax}
            className={`
                flex items-center justify-between px-3 py-2 rounded border transition-all text-xs
                ${isMax
                    ? 'bg-transparent border-gray-800 opacity-50 cursor-default'
                    : canAfford
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-white'
                        : 'bg-transparent border-gray-800 opacity-50 cursor-not-allowed'}
            `}
        >
            <span className={`font-bold ${colorClass} uppercase`}>{t(label)} <span className="text-white ml-1">{current}</span></span>
            {!isMax && <span className="text-yellow-500 font-bold">{cost}</span>}
            {isMax && <span className="text-gray-600 font-bold">{t('MAX')}</span>}
        </button>
    );
};
