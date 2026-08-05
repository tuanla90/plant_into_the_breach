import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * OrientationOverlay
 * 
 * Detects if a mobile device is held in PORTRAIT mode and presents a sleek
 * cyber-styled overlay encouraging the user to rotate their phone to LANDSCAPE mode.
 * 
 * Provides an optional "Dismiss" button so desktop users with narrow windows
 * or specific setups are never hard-blocked.
 */
export const OrientationOverlay: React.FC = () => {
    const { t } = useI18n();
    const [isPortraitMobile, setIsPortraitMobile] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isMobile = window.innerWidth <= 1024 || 'ontouchstart' in window;
            const isPortrait = window.innerHeight > window.innerWidth;
            setIsPortraitMobile(isMobile && isPortrait);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (!isPortraitMobile || dismissed) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
            {/* Dismiss button in upper corner */}
            <button 
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full bg-white/5 border border-white/10"
                title={t('Tiếp tục ở màn hình đứng')}
            >
                <X size={20} />
            </button>

            {/* Rotating Phone Animation Icon */}
            <div className="relative mb-6 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-sky-500/10 border border-sky-400/30 flex items-center justify-center animate-pulse">
                    <Smartphone size={40} className="text-sky-400 transform -rotate-90 animate-[spin_4s_easeInOut_infinite]" />
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 shadow-lg animate-bounce">
                    <RotateCw size={16} className="text-black font-bold" />
                </div>
            </div>

            <h2 className="text-xl font-bold text-sky-400 uppercase tracking-wide mb-2 font-display">
                {t('Vui Lòng Xoay Ngang Màn Hình')}
            </h2>

            <p className="text-sm text-gray-300 max-w-xs leading-relaxed mb-6">
                {t('Trải nghiệm chiến thuật 2.5D tuyệt vời nhất khi xoay ngang điện thoại (Landscape Mode).')}
            </p>

            <button
                onClick={() => setDismissed(true)}
                className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold border border-slate-600 transition-colors"
            >
                {t('Vẫn tiếp tục ở màn hình dọc')}
            </button>

            <style>{`
                @keyframes spin {
                    0%, 15% { transform: rotate(0deg); }
                    40%, 65% { transform: rotate(-90deg); }
                    90%, 100% { transform: rotate(0deg); }
                }
            `}</style>
        </div>
    );
};
