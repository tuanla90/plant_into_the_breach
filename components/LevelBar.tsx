import React from 'react';
import { ChevronsUp, Star } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * Commander level, and what this run added to it.
 *
 * Meta-progression used to arrive through three counters nobody could see — a personal-best
 * layer, a boss clear and every third bonus objective. This is the whole thing as one bar:
 * what the run was worth, what level it put you on, and how far the next one is.
 *
 * Shown on both endings on purpose. A lost run still pays, and a player who is only ever
 * told that on the victory screen has no reason to believe it.
 */
export interface LevelBarProps {
    /** XP this run earned. */
    gained: number;
    /** Level before the run was cashed in. */
    before: number;
    /** Level after. Equal to `before` when the run did not finish a level. */
    after: number;
    /** Progress into the level shown, and what the next one costs. */
    into: number;
    needed: number;
    /** True while the payout has not landed yet (the run is still going). */
    pending?: boolean;
    /** At the boss ceiling. XP still banks; it just cannot buy a level until a boss falls. */
    capped?: boolean;
}

export const LevelBar: React.FC<LevelBarProps> = ({ gained, before, after, into, needed, pending, capped }) => {
    const { t } = useI18n();
    const levelledUp = after > before;
    const pct = needed > 0 ? Math.min(100, Math.round((into / needed) * 100)) : 0;

    return (
        <div className={`w-full rounded p-3 flex flex-col gap-2 border-2
            ${levelledUp
                ? 'border-amber-500/70 bg-amber-950/25 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                : 'border-[#2b303b] bg-black/40'}`}>

            <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-400">
                    <Star size={13} className={levelledUp ? 'text-amber-400' : 'text-gray-500'} />
                    {pending ? t('This run is worth') : t('Commander level')}
                </span>
                <span className="text-sm font-black text-emerald-300">
                    +{gained} {t('XP')}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {levelledUp ? (
                    <span className="flex items-center gap-1.5 text-lg font-black text-amber-300 shrink-0">
                        {before} <ChevronsUp size={16} /> {after}
                    </span>
                ) : (
                    <span className="text-lg font-black text-gray-300 shrink-0">{after}</span>
                )}

                <div className="flex-1 h-2.5 bg-[#1a1d24] rounded overflow-hidden">
                    <div
                        className={`h-full transition-all duration-700
                            ${capped ? 'bg-gray-600' : levelledUp ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${capped ? 100 : pct}%` }}
                    />
                </div>

                {/* At the ceiling a fraction would be a lie — the bar cannot fill from here. */}
                <span className="text-[11px] font-mono text-gray-500 shrink-0">
                    {capped ? t('MAX') : `${into}/${needed}`}
                </span>
            </div>

            {levelledUp && !capped && (
                <div className="text-[11px] uppercase tracking-widest text-amber-400/90 text-center">
                    {t('Level up')}
                </div>
            )}

            {capped && (
                <div className="text-[11px] leading-4 text-gray-400 text-center normal-case tracking-normal">
                    {t('Level ceiling reached. Beat a boss to raise it — the XP keeps banking until you do.')}
                </div>
            )}
        </div>
    );
};
