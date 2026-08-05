import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Volume2, VolumeX, Globe, LogOut, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { getAudioSettings, setAudioSettings, subscribeAudio, toggleMute, sfx, AudioSettings } from '../utils/audio';

interface SettingsModalProps {
    /** External controlled open state */
    isOpen?: boolean;
    /** External close callback */
    onClose?: () => void;
    /** Whether to show the floating top-right gear icon trigger (default: true) */
    showFloatingTrigger?: boolean;
    /** Whether a run is currently active (in combat, map, shop, camp, event, etc.) */
    inRun?: boolean;
    /** Callback to abandon/quit the current run and return to main menu */
    onAbandonRun?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen: externalIsOpen,
    onClose: externalOnClose,
    showFloatingTrigger = false,
    inRun = false,
    onAbandonRun
}) => {
    const { t, lang, setLang } = useI18n();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
    const [audioSettingsState, setAudioSettingsState] = useState<AudioSettings>(getAudioSettings);
    const modalRef = useRef<HTMLDivElement>(null);

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const closeModal = () => {
        setInternalIsOpen(false);
        setShowAbandonConfirm(false);
        if (externalOnClose) externalOnClose();
    };

    useEffect(() => subscribeAudio(setAudioSettingsState), []);

    // Click outside to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: PointerEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                closeModal();
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [isOpen]);

    const handleSliderChange = (key: 'master' | 'music' | 'sfx', value: number) => {
        setAudioSettings({ [key]: value / 100 });
    };

    const handleAbandonClick = () => {
        if (showAbandonConfirm) {
            closeModal();
            if (onAbandonRun) onAbandonRun();
        } else {
            setShowAbandonConfirm(true);
        }
    };

    return (
        <>
            {/* FLOATING TOP-RIGHT GEAR ICON (Only when showFloatingTrigger is true) */}
            {showFloatingTrigger && (
                <div className="fixed top-3 right-3 z-[100] select-none pointer-events-auto">
                    <button
                        onClick={() => { setInternalIsOpen(true); setShowAbandonConfirm(false); }}
                        title={t('Cài Đặt')}
                        aria-label={t('Cài Đặt')}
                        className="p-2.5 rounded-lg bg-[#151821]/95 border border-[#363b45] text-gray-300 hover:text-white hover:border-sky-500 hover:bg-[#202534] transition-all shadow-xl backdrop-blur-md flex items-center justify-center group"
                    >
                        <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300 text-sky-400" />
                    </button>
                </div>
            )}

            {/* SETTINGS MODAL DIALOG */}
            {isOpen && (
                <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
                    <div
                        ref={modalRef}
                        className="w-full max-w-md max-h-full bg-[#13161f] border border-[#293245] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* MODAL HEADER */}
                        <div className="px-5 py-4 bg-[#1b202c] border-b border-[#293245] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Settings size={20} className="text-sky-400" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">
                                    {t('Cài Đặt Hệ Thống')}
                                </h2>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* MODAL BODY — flex-1 min-h-0 so header + body together never
                            exceed the max-h-full card; a fixed 80dvh ignored the header
                            and pushed the last section past the bottom edge. */}
                        <div className="p-5 space-y-6 flex-1 min-h-0 overflow-y-auto">

                            {/* SECTION 1: AUDIO SETTINGS */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                                        <Volume2 size={16} />
                                        {t('Âm Thanh')}
                                    </span>
                                    <button
                                        onClick={toggleMute}
                                        className={`px-3 py-1 text-xs font-bold uppercase rounded border transition-colors flex items-center gap-1.5 ${
                                            audioSettingsState.muted
                                                ? 'bg-red-950/80 border-red-500 text-red-400'
                                                : 'bg-green-950/80 border-green-500 text-green-400'
                                        }`}
                                    >
                                        {audioSettingsState.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                        {audioSettingsState.muted ? t('Tắt Âm') : t('Bật Âm')}
                                    </button>
                                </div>

                                {/* MASTER VOLUME */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-300">
                                        <span>{t('Âm Lượng Tổng (Master)')}</span>
                                        <span className="font-mono text-sky-400">{Math.round(audioSettingsState.master * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={100} step={5}
                                        value={Math.round(audioSettingsState.master * 100)}
                                        onChange={e => handleSliderChange('master', Number(e.target.value))}
                                        onPointerUp={() => sfx('ui-select')}
                                        className="w-full accent-sky-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
                                    />
                                </div>

                                {/* MUSIC VOLUME */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-300">
                                        <span>{t('Nhạc Nền (Music)')}</span>
                                        <span className="font-mono text-sky-400">{Math.round(audioSettingsState.music * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={100} step={5}
                                        value={Math.round(audioSettingsState.music * 100)}
                                        onChange={e => handleSliderChange('music', Number(e.target.value))}
                                        onPointerUp={() => sfx('ui-select')}
                                        className="w-full accent-sky-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
                                    />
                                </div>

                                {/* SFX VOLUME */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-300">
                                        <span>{t('Hiệu Ứng (Effects)')}</span>
                                        <span className="font-mono text-sky-400">{Math.round(audioSettingsState.sfx * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={100} step={5}
                                        value={Math.round(audioSettingsState.sfx * 100)}
                                        onChange={e => handleSliderChange('sfx', Number(e.target.value))}
                                        onPointerUp={() => sfx('ui-select')}
                                        className="w-full accent-sky-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* SECTION 2: LANGUAGE SELECTION */}
                            <div className="space-y-3 pt-2 border-t border-gray-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                                    <Globe size={16} />
                                    {t('Ngôn Ngữ (Language)')}
                                </span>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setLang('vi')}
                                        className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                                            lang === 'vi'
                                                ? 'bg-sky-600 border-sky-400 text-white shadow-lg'
                                                : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {lang === 'vi' && <Check size={14} />}
                                        Tiếng Việt (VI)
                                    </button>

                                    <button
                                        onClick={() => setLang('en')}
                                        className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                                            lang === 'en'
                                                ? 'bg-sky-600 border-sky-400 text-white shadow-lg'
                                                : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {lang === 'en' && <Check size={14} />}
                                        English (EN)
                                    </button>
                                </div>
                            </div>

                            {/* SECTION 3: ABANDON RUN (ONLY WHEN ACTIVE IN RUN) */}
                            {inRun && onAbandonRun && (
                                <div className="space-y-3 pt-3 border-t border-gray-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                                        <LogOut size={16} />
                                        {t('Quản Lý Trận Đấu')}
                                    </span>

                                    {!showAbandonConfirm ? (
                                        <button
                                            onClick={() => setShowAbandonConfirm(true)}
                                            className="w-full py-3 bg-red-950/60 hover:bg-red-900 border border-red-700/80 text-red-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            {t('Thoát Trận (Bỏ Cuộc)')}
                                        </button>
                                    ) : (
                                        <div className="bg-red-950/80 border border-red-600 p-3 rounded-lg space-y-2 text-center animate-fadeIn">
                                            <p className="text-xs text-red-200 font-semibold">
                                                {t('Bạn có chắc muốn bỏ cuộc? Tiến trình run hiện tại sẽ bị hủy.')}
                                            </p>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={handleAbandonClick}
                                                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded uppercase transition-colors"
                                                >
                                                    {t('Đồng Ý Bỏ Cuộc')}
                                                </button>
                                                <button
                                                    onClick={() => setShowAbandonConfirm(false)}
                                                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded uppercase transition-colors"
                                                >
                                                    {t('Hủy')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* MODAL FOOTER */}
                        <div className="px-5 py-3 bg-[#171a24] border-t border-[#293245] flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                {t('Hoàn Tất')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
