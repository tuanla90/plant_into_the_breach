import React from 'react';
import { Flame, Snowflake, Zap } from 'lucide-react';
import { ElementId } from '../types';
import { ELEMENT_DEFINITIONS } from '../utils/elements';
import { useI18n } from '../i18n';

/**
 * "This hero carries an element", shown wherever a hero is shown.
 *
 * It exists because the price is paid at squad select and felt for the rest of the run: a
 * player looking at Ironhusk on 8 max HP two hours later has no way to know why she is not on
 * 10 unless something says so. In a game built on perfect information, a stat that quietly
 * differs from the sheet is a bug even when the number is correct.
 *
 * READABILITY CONSTRAINT, and the reason this is a chip rather than a bare icon: the board
 * already draws BURN as an orange flame and FREEZE as a blue snowflake (UnitComponent's status
 * column). An element badge drawn the same way would be read as "this hero is on fire" instead
 * of "this hero sets things on fire" — the opposite meaning. So statuses stay bare icons in the
 * top-left, and an element is always a bordered, tinted chip somewhere else.
 */

const ELEMENT_ICONS: Record<ElementId, React.ComponentType<{ size?: number; className?: string }>> = {
    ICE: Snowflake,
    FIRE: Flame,
    LIGHTNING: Zap,
};

interface ElementBadgeProps {
    element: ElementId;
    /** Glyph size in px. The chip sizes itself around it. */
    size?: number;
    /** Show the element's name beside the glyph. Off for dense spots like the board. */
    showName?: boolean;
    className?: string;
}

export const ElementBadge: React.FC<ElementBadgeProps> = ({ element, size = 10, showName = false, className = '' }) => {
    const { t } = useI18n();
    const def = ELEMENT_DEFINITIONS[element];
    const Icon = ELEMENT_ICONS[element];

    return (
        <span
            // Both name and effect in the tooltip: the glyph alone cannot say what LIGHTNING
            // does, and this is often the only place mid-run that can explain it.
            title={`${t(def.name)} — ${t(def.description)}`}
            className={`inline-flex items-center gap-[2px] rounded-sm border px-[3px] py-[1px] leading-none bg-black/70 ${className}`}
            style={{ borderColor: def.accent, color: def.accent }}
        >
            <Icon size={size} />
            {showName && (
                <span className="text-[9px] font-bold uppercase tracking-wide">{t(def.name)}</span>
            )}
        </span>
    );
};
