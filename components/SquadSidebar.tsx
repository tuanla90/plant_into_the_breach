import React from 'react';
import { Unit, UnitType } from '../types';
import { useI18n } from '../i18n';
import { Shield } from 'lucide-react';
import { ElementBadge } from './ElementBadge';
import { ELEMENT_DEFINITIONS } from '../utils/elements';
import { mobileSprite } from '../utils/platform';

interface SquadSidebarProps {
  units: Unit[];
  selectedUnitId: string | null;
  onSelectUnit: (id: string) => void;
}

/**
 * The in-combat hero picker down the left edge.
 *
 * Props are annotated on the parameter rather than through `React.FC<Props>`: under this
 * tsconfig the generic form left `units` as `any` inside the body, which is how
 * `unit.armor` and `unit.name` — neither of which exists on `Unit` — sat here unnoticed and
 * unflagged by `tsc`. The armour badge could never render.
 */
export const SquadSidebar = ({ units, selectedUnitId, onSelectUnit }: SquadSidebarProps) => {
  const { t } = useI18n();
  // Benched plants sit at (-1,-1) during placement. Listing them offers a pick that puts a
  // selection ring on nothing.
  const squad = units.filter(u => u.type === UnitType.PLANT && u.position.x >= 0);

  if (squad.length === 0) return null;

  return (
    // In-flow column, not a fixed overlay: floated at `fixed top-24 left-4` it sat on top
    // of the board's left file, and with four-plus units it ran straight off the bottom of
    // a mobile-landscape screen with no way to scroll. As a flex child the board simply
    // gets measured around it, and the column itself scrolls when it is taller than the
    // fight area.
    <div className="shrink-0 flex flex-col gap-2 lg:gap-3 py-2 px-1.5 lg:px-2 overflow-y-auto overflow-x-hidden font-pixel select-none">
        {squad.map(unit => {
            const isSelected = selectedUnitId === unit.id;
            const isActed = unit.hasAttacked;
            const label = t(unit.class.replace(/_/g, ' '));
            const shield = unit.shield || 0;
            // Above six pips the slivers are thinner than the gaps between them, so a
            // proportional bar reads better than a segmented one.
            const useBar = unit.maxHp > 6;
            const hpPct = Math.max(0, Math.min(1, unit.hp / unit.maxHp)) * 100;

            // The tutorial anchor: heroes by hero id, bench plants by MATERIAL id — a bench
            // unit's `id` is minted per battle, so a script could never name it ahead of time.
            return (
                <button
                    key={unit.id}
                    type="button"
                    onClick={() => onSelectUnit(unit.id)}
                    title={`${label} — ${unit.hp}/${unit.maxHp} HP${shield ? ` (+${shield})` : ''}${unit.element ? ` · ${t(ELEMENT_DEFINITIONS[unit.element].name)}` : ''}`}
                    aria-label={label}
                    aria-pressed={isSelected}
                    data-tut={unit.heroId ? `hero-${unit.heroId}` : unit.materialId ? `unit-${unit.materialId}` : `unit-${unit.id}`}
                    className={`
                        relative group cursor-pointer transition-all duration-200 text-left
                        ${isSelected ? '' : 'hover:brightness-110'}
                        ${isActed ? 'opacity-50 grayscale' : ''}
                    `}
                >
                    {/* Portrait Frame */}
                    <div className={`
                        w-12 h-12 lg:w-16 lg:h-16 bg-[#121622] rounded-xl border-2 transition-all duration-200 overflow-hidden shadow-xl relative
                        ${isSelected
                            ? 'border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/30'
                            : 'border-[#293245] hover:border-sky-400'}
                    `}>
                        <img src={mobileSprite(unit.imgUrl)} className="w-full h-full object-contain p-1" alt={label} />

                        {/* HP readout */}
                        <div className="absolute bottom-0 left-0 w-full bg-[#0b0d14]/80 p-0.5 backdrop-blur-xs">
                            {useBar ? (
                                <div className="h-1.5 w-full bg-gray-700 rounded-[1px] overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)] transition-[width] duration-200"
                                        style={{ width: `${hpPct}%` }}
                                    />
                                </div>
                            ) : (
                                <div className="flex gap-0.5">
                                    {Array.from({ length: unit.maxHp }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-[1px] transition-colors ${i < unit.hp ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]' : 'bg-gray-700'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shield badge. Was keyed off `unit.armor`, a field that does not exist,
                        so it never appeared no matter how much Armor a hero was carrying. */}
                    {shield > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-sky-600 border border-sky-300 rounded-full flex items-center justify-center gap-0.5 text-[9px] font-black text-white shadow-md">
                            <Shield size={8} fill="white" />{shield}
                        </div>
                    )}

                    {/* Element badge. Bottom-right is the only corner left: shield holds
                        top-right, the wounded marker top-left, and the HP readout the whole
                        bottom edge inside the frame. */}
                    {unit.element && (
                        <div className="absolute -bottom-1.5 -right-1.5 z-10">
                            <ElementBadge element={unit.element} size={9} />
                        </div>
                    )}

                    {/* Wounded marker */}
                    {unit.hp < unit.maxHp && (
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-600 border border-red-300 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shadow-md animate-pulse">!</div>
                    )}
                </button>
            );
        })}
    </div>
  );
};
