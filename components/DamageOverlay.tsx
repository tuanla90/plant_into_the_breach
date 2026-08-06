
import React from 'react';
import { DamageEvent } from '../types';
import { Sun as Sol, Coins, Gem } from 'lucide-react';
import { useI18n } from '../i18n';

interface DamageOverlayProps {
  events: DamageEvent[];
}

export const DamageOverlay: React.FC<DamageOverlayProps> = ({ events }) => {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {events.map((evt) => (
        <div
          key={evt.id}
          className="absolute flex flex-col items-center animate-[floatUp_1.5s_ease-out_forwards]"
          style={{
            // FIX: Swap X and Y. Board X is Row (Top), Board Y is Col (Left).
            left: `${(evt.y * 12.5) + 6.25}%`, // Center of tile (100/8 = 12.5)
            top: `${(evt.x * 12.5)}%`,
          }}
        >
          {evt.type === 'SUN' && (
             <div className="flex items-center gap-1 text-yellow-400 font-bold text-xl drop-shadow-md stroke-black" style={{ textShadow: '1px 1px 0 #000' }}>
                 <Sol size={20} fill="currentColor" /> +{evt.amount}
             </div>
          )}
          
          {evt.type === 'COIN' && (
             <div className="flex items-center gap-1 text-yellow-200 font-bold text-lg drop-shadow-md stroke-black" style={{ textShadow: '1px 1px 0 #000' }}>
                 <Coins size={18} fill="currentColor" /> +{evt.amount}
             </div>
          )}
          
          {evt.type === 'DIAMOND' && (
             <div className="flex items-center gap-1 text-cyan-300 font-bold text-lg drop-shadow-md stroke-black" style={{ textShadow: '1px 1px 0 #000' }}>
                 <Gem size={18} fill="currentColor" /> +{evt.amount}
             </div>
          )}

          {['DAMAGE', 'HEAL', 'BLOCK', 'MISS', 'BLOCKED', 'DROWN'].includes(evt.type) && (
            <span 
                className={`
                    text-2xl font-black stroke-black stroke-2 drop-shadow-md font-pixel
                    ${evt.type === 'DAMAGE' ? 'text-red-500' :
                    evt.type === 'HEAL' ? 'text-green-400' :
                    evt.type === 'BLOCK' ? 'text-orange-400' :
                    evt.type === 'DROWN' ? 'text-sky-300' : 'text-white'}
                `}
                style={{ textShadow: '2px 2px 0 #000' }}
            >
                {evt.type === 'DAMAGE' ? `-${evt.amount}` :
                evt.type === 'HEAL' ? `+${evt.amount}` :
                t(evt.type)}
            </span>
          )}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { transform: translateY(-10px) scale(1.2); opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(-50px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
