import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n, LanguageToggle } from '../i18n';
import {
    getAudioSettings, setAudioSettings, subscribeAudio, toggleMute, sfx,
    type AudioSettings
} from '../utils/audio';

/**
 * Global Top Right Control Bar:
 * Combines Audio Controls (Mute & Volume sliders) and Language Toggle (VI/EN)
 * into a single, unified, seamless cyberpunk panel.
 */
export const AudioControls: React.FC = () => {
    const { t } = useI18n();
    const [settings, setLocal] = useState<AudioSettings>(getAudioSettings);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => subscribeAudio(setLocal), []);

    // Click-away. Without it the panel stays open over the board and eats clicks.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [open]);

    const slider = (label: string, key: 'master' | 'music' | 'sfx') => (
        <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#8b93a7]">
            <span className="w-20 shrink-0">{label}</span>
            <input
                type="range" min={0} max={100} step={5}
                value={Math.round(settings[key] * 100)}
                onChange={e => setAudioSettings({ [key]: Number(e.target.value) / 100 })}
                onPointerUp={() => sfx('ui-select')}
                className="w-28 accent-[#4ade80] cursor-pointer"
            />
            <span className="w-8 text-right text-[#e6e8ee] tabular-nums">{Math.round(settings[key] * 100)}</span>
        </label>
    );

    return (
        <div ref={wrapRef} className="fixed top-3 right-3 z-[100] flex flex-col items-end gap-1.5 pointer-events-auto select-none">
            {/* UNIFIED SEAMLESS CONTROL BAR */}
            <div className="bg-[#151821]/95 border border-[#363b45] p-1 rounded-lg flex items-center gap-2 backdrop-blur-md shadow-xl">
                {/* Audio Controls Group */}
                <div className="flex items-center rounded-md overflow-hidden border border-[#2a2e39] bg-black/40">
                    <button
                        onClick={toggleMute}
                        title={settings.muted ? t('Unmute') : t('Mute')}
                        aria-label={settings.muted ? t('Unmute') : t('Mute')}
                        className={`p-1.5 hover:bg-[#23262f] transition-colors ${settings.muted ? 'text-[#ef4444]' : 'text-[#8b93a7]'}`}
                    >
                        {settings.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <button
                        onClick={() => setOpen(o => !o)}
                        title={t('Audio settings')}
                        aria-label={t('Audio settings')}
                        className="px-1.5 py-1.5 border-l border-[#2a2e39] hover:bg-[#23262f] text-[#8b93a7] text-[10px] leading-none transition-colors"
                    >
                        {open ? '▾' : '▴'}
                    </button>
                </div>

                {/* Divider Line */}
                <div className="w-[1px] h-4 bg-[#2f3542]"></div>

                {/* Language Switch Group */}
                <LanguageToggle className="!bg-transparent !border-0 !p-0" />
            </div>

            {/* VOLUME SLIDERS DROPDOWN */}
            {open && (
                <div className="bg-[#151821]/95 border border-[#363b45] p-3 space-y-2 backdrop-blur-md shadow-2xl rounded-lg animate-fadeIn z-[101]">
                    {slider(t('Master'), 'master')}
                    {slider(t('Music'), 'music')}
                    {slider(t('Effects'), 'sfx')}
                </div>
            )}
        </div>
    );
};
