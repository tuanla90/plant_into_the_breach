
import React from 'react';
import { Unit, UnitType } from '../types';
import { Shield, Zap, Move, Heart, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { ElementBadge } from './ElementBadge';
import { ELEMENT_HP_COST } from '../utils/elements';

interface SquadViewerProps {
  units: Unit[];
  onClose: () => void;
}

export const SquadViewer: React.FC<SquadViewerProps> = ({ units, onClose }) => {
  const { t } = useI18n();
  const plants = units.filter(u => u.type === UnitType.PLANT);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center font-pixel p-8">
        <div className="w-full max-w-5xl flex flex-col h-full max-h-[80dvh]">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-gray-700 pb-4">
                <h2 className="text-3xl text-white uppercase tracking-[0.2em] font-bold">{t('Active Squad')}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={32} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
                {plants.map(unit => (
                    <div key={unit.id} className="bg-[#1a1c21] border-2 border-[#363b45] p-4 flex gap-4 hover:border-yellow-500 transition-colors group relative overflow-hidden shadow-lg">
                        
                        {/* Background Deco */}
                        <div className="absolute -right-4 -bottom-4 text-[100px] text-white/5 font-black z-0 pointer-events-none uppercase">
                            {(unit.role || 'UNIT').substring(0,3)}
                        </div>

                        {/* Portrait */}
                        <div className="w-24 h-24 bg-black border border-gray-600 shrink-0 relative z-10">
                            <img src={unit.imgUrl} className="w-full h-full object-contain" />
                            <div className="absolute top-0 left-0 bg-yellow-600 text-black text-xs font-bold px-1">
                                {t('Lv {level}', { level: unit.level })}
                            </div>
                        </div>

                        {/* Stats & Info */}
                        <div className="flex-1 z-10 flex flex-col">
                            <h3 className="text-xl text-green-400 font-bold uppercase leading-none mb-1">{t(unit.class.replace(/_/g, ' '))}</h3>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-500 uppercase tracking-widest">{t(unit.role)}</span>
                                {unit.element && <ElementBadge element={unit.element} size={11} showName />}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                {/* The element's bill is already inside maxHp, so the number
                                    here silently disagrees with the hero sheet. Say why. */}
                                <div
                                    className="bg-gray-800/50 p-1 flex items-center justify-between rounded px-2"
                                    title={unit.element ? t('-{n} max HP', { n: ELEMENT_HP_COST }) : undefined}
                                >
                                    <span className="text-red-400 flex items-center gap-1"><Heart size={12} /> {t('HP')}</span>
                                    <span className="font-bold">
                                        {unit.hp}/{unit.maxHp}
                                        {unit.element && (
                                            <span className="ml-1 text-[10px] font-normal text-gray-500">−{ELEMENT_HP_COST}</span>
                                        )}
                                    </span>
                                </div>
                                <div className="bg-gray-800/50 p-1 flex items-center justify-between rounded px-2">
                                    <span className="text-yellow-400 flex items-center gap-1"><Zap size={12} /> {t('DMG')}</span>
                                    <span className="font-bold">{unit.damage}</span>
                                </div>
                                <div className="bg-gray-800/50 p-1 flex items-center justify-between rounded px-2">
                                    <span className="text-blue-400 flex items-center gap-1"><Move size={12} /> {t('MOVE')}</span>
                                    <span className="font-bold">{unit.moveRange}</span>
                                </div>
                                <div className="bg-gray-800/50 p-1 flex items-center justify-between rounded px-2">
                                    <span className="text-purple-400 flex items-center gap-1"><Shield size={12} /> {t('DEF')}</span>
                                    <span className="font-bold">{unit.immunities.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {plants.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12 text-xl">
                        {t('NO ACTIVE UNITS')}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
