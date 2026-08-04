
import React from 'react';
import { Trophy, ArrowRight, Coins, Check } from 'lucide-react';
import { MissionBonus } from '../types';
import { useI18n } from '../i18n';
import { UnlockPanel } from './UnlockPanel';
import { UnlockAward } from '../data/unlocks';

interface VictoryScreenProps {
    onContinue: () => void;
    /**
     * Coin actually about to be paid, and which bonus objectives earned part of it.
     * Comes from `previewRewards()` — the screen used to print a hardcoded "+100 Sun",
     * which was wrong twice: rewards are Coin, and the amount depends on the node type
     * and the bonuses that were met.
     */
    rewards: { coins: number; bonuses: MissionBonus[] };
    /** Anything this fight unlocked. Empty most fights; the panel hides itself when so. */
    unlocks?: UnlockAward[];
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ onContinue, rewards, unlocks = [] }) => {
    const { t } = useI18n();
    const bonusCoins = rewards.bonuses.reduce((total, b) => total + b.coins, 0);
    const baseCoins = Math.max(0, rewards.coins - bonusCoins);

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center font-pixel animate-in fade-in duration-500">
            <div className="bg-[#1a1c21] border-4 border-yellow-500 p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] relative overflow-hidden">
                {/* Background Rays */}
                <div className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg,transparent_0deg_10deg,rgba(255,255,0,0.05)_10deg_20deg)] animate-[spin_20s_linear_infinite]"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <Trophy size={64} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-bounce" />

                    <div>
                        <h1 className="text-4xl text-yellow-400 font-bold uppercase tracking-widest mb-2">{t('Sector Secured!')}</h1>
                        <p className="text-gray-400 text-sm uppercase tracking-wider">{t('All threats neutralized')}</p>
                    </div>

                    {/* Above the Coin line on purpose: earning a hero outranks earning money,
                        and it is the thing the player must not scroll past. */}
                    <UnlockPanel awards={unlocks} />

                    <div className="w-full bg-black/40 border border-gray-700 p-4 rounded flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 uppercase text-sm">{t('Mission Reward')}</span>
                            <span className="flex items-center gap-2 text-amber-300 font-bold">
                                <Coins size={18} /> +{baseCoins}
                            </span>
                        </div>

                        {/* Every bonus that was actually met, priced individually — the player
                            should be able to see which optional goal paid for what. */}
                        {rewards.bonuses.map(bonus => (
                            <div key={bonus.type} className="flex items-center justify-between gap-3 text-left border-t border-gray-800 pt-2">
                                <span className="flex items-center gap-2 text-emerald-300 text-sm">
                                    <Check size={15} className="shrink-0" />
                                    {t(bonus.description)}
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-300 font-bold shrink-0">
                                    <Coins size={15} /> +{bonus.coins}
                                </span>
                            </div>
                        ))}

                        <div className="flex items-center justify-between border-t-2 border-gray-700 pt-2">
                            <span className="text-gray-300 uppercase text-sm font-bold">{t('Total')}</span>
                            <span className="flex items-center gap-2 text-yellow-300 font-bold text-2xl">
                                <Coins size={24} /> +{rewards.coins}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onContinue}
                        className="group bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 uppercase tracking-[0.2em] shadow-lg border-b-4 border-green-800 active:border-0 active:translate-y-1 transition-all flex items-center gap-2"
                    >
                        {t('Continue')} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
