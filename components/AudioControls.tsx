import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import {
    getAudioSettings, setAudioSettings, subscribeAudio, toggleMute, sfx,
    type AudioSettings
} from '../utils/audio';

/**
 * The one place the player can turn the game down. Rendered once by App at a fixed corner
 * so it is reachable from every screen — muting only from the main menu would be useless
 * exactly when someone needs it, which is mid-battle.
 *
 * Settings live in utils/audio (module state + localStorage), not in React state, because
 * the turn loop calls `sfx()` from outside the component tree. This subscribes so the UI
 * still tracks changes made anywhere else.
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
                // A volume slider you cannot hear is guesswork, so every change plays a tick.
                onPointerUp={() => sfx('ui-select')}
                className="w-28 accent-[#4ade80] cursor-pointer"
            />
            <span className="w-8 text-right text-[#e6e8ee] tabular-nums">{Math.round(settings[key] * 100)}</span>
        </label>
    );

    return (
        <div ref={wrapRef} className="fixed bottom-3 left-3 z-[60] flex flex-col items-start gap-2">
            {open && (
                <div className="bg-[#151821]/95 border border-[#363b45] p-3 space-y-2 backdrop-blur-sm shadow-xl">
                    {slider(t('Master'), 'master')}
                    {slider(t('Music'), 'music')}
                    {slider(t('Effects'), 'sfx')}
                </div>
            )}

            <div className="flex items-center">
                <button
                    onClick={toggleMute}
                    title={settings.muted ? t('Unmute') : t('Mute')}
                    aria-label={settings.muted ? t('Unmute') : t('Mute')}
                    className={`p-2 border border-[#363b45] bg-[#151821]/90 hover:bg-[#23262f] transition-colors
                        ${settings.muted ? 'text-[#ef4444]' : 'text-[#8b93a7]'}`}
                >
                    {settings.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                    onClick={() => setOpen(o => !o)}
                    title={t('Audio settings')}
                    aria-label={t('Audio settings')}
                    className="px-1.5 py-2 border border-l-0 border-[#363b45] bg-[#151821]/90 hover:bg-[#23262f]
                        text-[#8b93a7] text-[10px] leading-none transition-colors"
                >
                    {open ? '▾' : '▴'}
                </button>
            </div>
        </div>
    );
};
