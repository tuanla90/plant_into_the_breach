import React, { useEffect } from 'react';
import { ItemDefinition } from '../types';
import { useI18n } from '../i18n';
import { Compass } from 'lucide-react';

interface SectorGiftToastProps {
    item: ItemDefinition;
    onClose: () => void;
}

/**
 * "New ground, new tool" — the announcement for a sector's first-arrival item grant
 * (useGameProgression.visitSector). A toast, NOT a modal: it lands while the player is
 * heading into a battle, and the one thing it must never do is stand between them and
 * the board. Auto-dismisses; a click hurries it along.
 */
export const SectorGiftToast: React.FC<SectorGiftToastProps> = ({ item, onClose }) => {
    const { t } = useI18n();

    useEffect(() => {
        const timer = setTimeout(onClose, 6500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <button
            onClick={onClose}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-4 py-3
                       bg-[#14121c]/95 border-2 border-emerald-400/70 rounded-lg shadow-[0_0_30px_rgba(52,211,153,0.3)]
                       font-pixel text-left animate-[bounce_1s_ease-out_1]"
        >
            <Compass size={26} className="text-emerald-300 shrink-0" />
            <img src={item.imgUrl} alt={item.name} className="w-10 h-10 object-contain shrink-0" />
            <span className="flex flex-col leading-tight">
                <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-black">
                    {t('New ground, new tool')}
                </span>
                <span className="text-sm text-white font-bold">{t(item.name)}</span>
                <span className="text-[10px] text-gray-400 normal-case">
                    {t('Added to your items — and now sold in shops.')}
                </span>
            </span>
        </button>
    );
};
