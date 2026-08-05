import React from 'react';
import { HeroRole } from '../types';
import { Crosshair, Shield, Crown } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * THE ROSTER'S THREE THIRDS, in one place.
 *
 * PLAN-heroes-9.md's closing table is three ranged, three melee, three support, and two
 * screens render it: the squad picker and the Archive's roster tab. They are shared rather
 * than copied because the failure mode of copying is silent — the same hero labelled
 * "Support" on one screen and "Tactical" on the other, with nothing to catch it.
 *
 * Note this is NOT `UNIT_ROLE_MAP[baseClass]`. That map answers "what does this plant do on
 * the field" and disagrees on two heroes, calling Cobb and Chardwall TACTICAL. The roster
 * reads them as the arcing artillery piece and the support that repositions — see the
 * `role` field on HeroDefinition.
 */
export const ROLE_META: Record<HeroRole, { label: string; blurb: string; icon: React.ReactNode; color: string }> = {
    RANGED:  { label: 'Ranged',  blurb: 'Damage from a distance.',      icon: <Crosshair size={13} />, color: '#7dd3fc' },
    MELEE:   { label: 'Melee',   blurb: 'Holds the line up close.',     icon: <Shield size={13} />,    color: '#fca5a5' },
    SUPPORT: { label: 'Support', blurb: 'Sun, shields, repositioning.', icon: <Crown size={13} />,     color: '#fcd34d' },
};

/** Group render order. roster.assert.ts fails the build on any role outside this list. */
export const ROLE_ORDER: HeroRole[] = ['RANGED', 'MELEE', 'SUPPORT'];

/** The role badge worn on a hero card. */
export const HeroRoleChip: React.FC<{ role: HeroRole; dim?: boolean }> = ({ role, dim }) => {
    const { t } = useI18n();
    const meta = ROLE_META[role];
    const color = dim ? '#6b7280' : meta.color;
    return (
        <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shrink-0"
            style={{ color, borderColor: `${color}55`, backgroundColor: `${color}12` }}
        >
            {meta.icon}{t(meta.label)}
        </span>
    );
};
