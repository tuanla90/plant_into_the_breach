import React from 'react';
import { ItemDefinition } from '../types';
import { useI18n } from '../i18n';
import { Coins, History } from 'lucide-react';

interface ChronoEchoModalProps {
    items: ItemDefinition[];
    onPick: (item: ItemDefinition) => void;
}

/**
 * THE CHRONO ECHO — a lost run's parting gift, offered once at the start of the next run
 * (Slay the Spire's Neow, in spirit). The player CHOOSES one of the rolled items, because
 * a consolation you did not pick is just loot; what may appear on the shelf is the caller's
 * business — App rolls the offer and caps its value by how deep the fallen run got.
 *
 * No close button and no skip, on purpose. The offer only exists after a defeat, all three
 * choices are strictly free value, and a "no thanks" path is a decision with no upside that
 * every player must nonetheless parse. Pick one and get on with the run.
 */
export const ChronoEchoModal: React.FC<ChronoEchoModalProps> = ({ items, onPick }) => {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-pixel">
            <div className="bg-[#14121c] border-2 border-fuchsia-500/70 rounded-lg shadow-[0_0_40px_rgba(217,70,239,0.25)] max-w-2xl w-full p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <History size={28} className="text-fuchsia-300" />
                    <h2 className="text-xl text-white font-black uppercase tracking-widest">{t('Chrono Echo')}</h2>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed normal-case">
                    {t('The fallen timeline sends one final gift forward. Take one item into this run.')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onPick(item)}
                            className="group flex flex-col items-center gap-2 p-4 rounded border-2 border-[#2b303b] bg-[#1a1c24] hover:border-fuchsia-400 hover:bg-[#221f2e] active:translate-y-0.5 transition-all"
                        >
                            <img src={item.imgUrl} alt={item.name} className="w-12 h-12 object-contain drop-shadow-[0_2px_6px_rgba(217,70,239,0.35)]" />
                            <span className="text-[12px] font-bold text-white uppercase tracking-wider text-center leading-tight">{t(item.name)}</span>
                            <span className="flex items-center gap-1 text-[10px] text-cyan-300"><Coins size={11} />{item.coinCost}</span>
                            <span className="text-[10px] leading-snug text-gray-500 normal-case text-center">{t(item.description)}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
