import React from 'react';
import { Lock, Sparkles, Users, FlaskConical } from 'lucide-react';
import { UnlockAward } from '../data/unlocks';
import { useI18n } from '../i18n';

/**
 * "You just earned this." Shown on the victory screen when a fight granted anything.
 *
 * The whole reason this exists: progress that is never announced is progress the player does
 * not know they made. A hero used to simply appear in the roster on the next run, which
 * reads as a bug rather than a reward — and a fusion recipe learned silently would never be
 * noticed at all, because nothing on screen changes until you next open the fusion bench.
 */
export const UnlockPanel: React.FC<{ awards: UnlockAward[] }> = ({ awards }) => {
    const { t } = useI18n();
    if (!awards.length) return null;

    const heroes = awards.filter(a => a.kind === 'HERO');

    return (
        <div className="w-full bg-black/50 border-2 border-fuchsia-600/70 rounded p-3 flex flex-col gap-2
                        shadow-[0_0_24px_rgba(217,70,239,0.25)] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-center gap-2 text-fuchsia-300 uppercase text-xs tracking-widest">
                <Sparkles size={14} />
                {/* A hero arriving is the bigger moment, so it gets to name the panel. */}
                {heroes.length ? t('New Ally') : t('Unlocked')}
                <Sparkles size={14} />
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {awards.map(a => (
                    <div key={`${a.kind}-${a.id}`}
                         className={`flex items-center gap-3 p-2 rounded border text-left
                            ${a.kind === 'HERO'
                                ? 'border-fuchsia-500/60 bg-fuchsia-950/30'
                                : 'border-sky-800/70 bg-sky-950/20'}`}>
                        {a.imgUrl
                            ? <img src={a.imgUrl} alt="" aria-hidden="true"
                                   className="w-12 h-12 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                            : <div className="w-12 h-12 shrink-0 flex items-center justify-center text-gray-600">
                                  <Lock size={20} />
                              </div>}

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                {a.kind === 'HERO'
                                    ? <Users size={11} className="text-fuchsia-400 shrink-0" />
                                    : <FlaskConical size={11} className="text-sky-400 shrink-0" />}
                                <span className={`text-[10px] uppercase tracking-widest shrink-0
                                    ${a.kind === 'HERO' ? 'text-fuchsia-400' : 'text-sky-400'}`}>
                                    {a.kind === 'HERO' ? t('Hero') : t('Fusion Recipe')}
                                </span>
                            </div>
                            <div className="text-sm font-bold text-white truncate">{t(a.title)}</div>
                            {a.subtitle && (
                                <p className="text-[11px] leading-snug text-gray-400 normal-case tracking-normal line-clamp-2">
                                    {t(a.subtitle)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
