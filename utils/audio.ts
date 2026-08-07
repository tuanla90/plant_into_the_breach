/**
 * Sound. One module, no React — the engine calls `sfx()` from inside the async turn loop,
 * which is not a component and must not re-render anything to make a noise.
 *
 * All audio is CC0 and lives in `public/audio/` (see /CREDITS.md and
 * `art-src/install_audio.mjs`, which is what put it there and can put it there again).
 *
 * Two things browsers force on us, handled here so callers never think about them:
 *
 *  1. AUTOPLAY. Nothing may sound before the user has interacted with the page. Every
 *     `sfx()`/`playMusic()` before that is remembered, not played; `unlock()` (wired to the
 *     first pointer/key event) starts the pending track. Calling play() anyway would throw
 *     an unhandled rejection on every click until the user touched something.
 *
 *  2. ONE ELEMENT CANNOT OVERLAP ITSELF. A grid game fires the same impact five times in
 *     one AoE, so each sound keeps a small pool of clones and round-robins through it.
 */

export type SfxName =
    | 'ui-click' | 'ui-select' | 'ui-back' | 'ui-coin' | 'ui-item' | 'ui-hover' | 'ui-error' | 'ui-text-blip'
    | 'zombie-groan' | 'env-wind' | 'env-lava'
    | 'step' | 'attack-melee' | 'attack-shot' | 'attack-lob' | 'attack-claw' | 'attack-bite' | 'attack-throw'
    | 'skill-cast' | 'skill-ult'
    | 'hit' | 'hit-heavy' | 'hit-collision' | 'hit-freeze' | 'hit-fire' | 'hit-ice' | 'hit-elec' | 'hit-blocked' | 'heal' | 'drown' | 'splash' | 'explosion'
    /** The nine-hero mechanics: shove, taunt, spike field, shield grant, lightning arc. */
    | 'push' | 'taunt' | 'spikes' | 'shield' | 'arc'
    | 'die-enemy' | 'die-plant'
    | 'spawn' | 'turn-start' | 'gain-sun' | 'sprout-lost'
    | 'victory' | 'defeat' | 'fusion';

export type MusicTrack = 'menu' | 'intro' | 'map' | 'combat' | 'boss';

/**
 * File + per-sound mix. `gain` is baked in because the packs are not mastered to a common
 * loudness — the alarm is twice the level of a footstep, and balancing at the call site
 * would mean re-tuning every caller. An array of files means "pick one at random", which
 * is what stops eight footsteps in a row from sounding like a machine.
 */
const SFX: Record<SfxName, { files: string[]; gain: number }> = {
    'ui-click':     { files: ['ui-click.wav'],   gain: 0.35 },
    'ui-select':    { files: ['ui-select.wav'],  gain: 0.55 },
    'ui-back':      { files: ['ui-back.wav'],    gain: 0.45 },
    'ui-coin':      { files: ['ui-coin.mp3'],    gain: 0.70 },
    'ui-item':      { files: ['ui-item.mp3'],    gain: 0.70 },
    'ui-hover':     { files: ['ui-hover.wav'],   gain: 0.30 },
    'ui-error':     { files: ['ui-error.wav'],   gain: 0.50 },
    'ui-text-blip': { files: ['ui-text-blip.wav'], gain: 0.40 },

    'zombie-groan': { files: ['zombie-groan.wav'], gain: 0.65 },
    'env-wind':     { files: ['env-wind.wav'],     gain: 0.45 },
    'env-lava':     { files: ['env-lava.wav'],     gain: 0.50 },

    'step':         { files: ['step-1.wav', 'step-2.wav', 'step-3.wav'], gain: 0.40 },

    'attack-melee': { files: ['attack-melee.wav'], gain: 0.75 },
    'attack-shot':  { files: ['attack-shot.wav'],  gain: 0.55 },
    'attack-lob':   { files: ['attack-lob.wav'],   gain: 0.55 },
    'attack-claw':  { files: ['attack-claw.wav'],  gain: 0.70 },
    'attack-bite':  { files: ['attack-bite.wav'],  gain: 0.75 },
    'attack-throw': { files: ['attack-throw.wav'], gain: 0.70 },
    'skill-cast':   { files: ['skill-cast.wav'],   gain: 0.60 },
    'skill-ult':    { files: ['skill-ult.wav'],    gain: 0.80 },

    'hit':           { files: ['hit-1.wav', 'hit-2.wav', 'hit-3.wav'], gain: 0.65 },
    'hit-heavy':     { files: ['hit-heavy.wav'],   gain: 0.75 },
    'hit-collision': { files: ['hit-collision.wav'], gain: 0.80 },
    'hit-freeze':    { files: ['hit-freeze.wav'],  gain: 0.60 },
    'hit-fire':      { files: ['hit-fire.wav'],    gain: 0.75 },
    'hit-ice':       { files: ['hit-freeze.wav'],  gain: 0.65 },
    'hit-elec':      { files: ['arc.wav'],         gain: 0.70 },
    'hit-blocked':   { files: ['hit-blocked.wav'], gain: 0.50 },
    'heal':          { files: ['heal.wav'],        gain: 0.55 },
    'drown':         { files: ['drown.wav'],       gain: 0.70 },
    'splash':        { files: ['splash.wav'],      gain: 0.65 },
    'explosion':     { files: ['explosion.wav'],   gain: 0.85 },

    // A shove happens several times in one Sweep, so it sits UNDER the impact layer —
    // loud enough to feel, quiet enough that four of them are not four hits.
    'push':         { files: ['push.wav'],        gain: 0.45 },
    // Deliberately near the top of the mix. A taunt turns the whole horde around; it is the
    // loudest decision a player makes in a turn and the board is about to look very different.
    'taunt':        { files: ['taunt.wav'],       gain: 0.75 },
    'spikes':       { files: ['spikes.mp3'],      gain: 0.55 },
    'shield':       { files: ['shield.wav'],      gain: 0.55 },
    'arc':          { files: ['arc.wav'],         gain: 0.50 },

    'die-enemy':    { files: ['die-enemy.wav'],   gain: 0.70 },
    'die-plant':    { files: ['die-plant.wav'],   gain: 0.70 },

    'spawn':        { files: ['spawn.wav'],       gain: 0.55 },
    'turn-start':   { files: ['turn-start.wav'],  gain: 0.45 },
    'gain-sun':     { files: ['gain-sun.wav'],    gain: 0.45 },
    // Losing a sprout is the worst thing that can happen in a run. It gets to be loud.
    'sprout-lost':   { files: ['sprout-lost.wav'],  gain: 1.00 },

    'victory':      { files: ['victory.mp3'],     gain: 0.80 },
    'defeat':       { files: ['defeat.wav'],      gain: 0.70 },
    'fusion':       { files: ['fusion.wav'],      gain: 0.65 },
};

const MUSIC: Record<MusicTrack, { file: string; gain: number; startTime?: number }> = {
    menu:   { file: 'music-menu.mp3',   gain: 0.30, startTime: 18 },
    intro:  { file: 'music-intro.mp3',  gain: 0.34 },
    map:    { file: 'music-map.mp3',    gain: 0.26, startTime: 8 },
    combat: { file: 'music-combat.mp3', gain: 0.30, startTime: 4 },
    boss:   { file: 'music-boss.mp3',   gain: 0.32, startTime: 6 },
};

// BASE_URL chứ không phải '/audio/' cứng: site deploy dưới đường dẫn con
// (github.io/plant_into_the_breach/), đường dẫn tuyệt đối trỏ về gốc domain
// và MỌI file âm thanh 404 — game câm hoàn toàn trên bản deploy trong khi
// localhost vẫn kêu bình thường. BASE_URL của Vite là './' nên phân giải
// theo URL trang ở cả hai môi trường.
const BASE = import.meta.env.BASE_URL + 'audio/';
const POOL_SIZE = 4;

// --- SETTINGS ---------------------------------------------------------------

const STORAGE_KEY = 'pitb_audio_v1';

export interface AudioSettings {
    master: number;   // 0..1
    sfx: number;      // 0..1
    music: number;    // 0..1
    muted: boolean;
}

const DEFAULTS: AudioSettings = { master: 0.7, sfx: 1, music: 0.6, muted: false };

const clamp01 = (n: unknown, fallback: number) =>
    typeof n === 'number' && isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;

const load = (): AudioSettings => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const s = JSON.parse(raw);
        return {
            master: clamp01(s.master, DEFAULTS.master),
            sfx: clamp01(s.sfx, DEFAULTS.sfx),
            music: clamp01(s.music, DEFAULTS.music),
            muted: !!s.muted,
        };
    } catch {
        return { ...DEFAULTS };
    }
};

let settings: AudioSettings = load();
const listeners = new Set<(s: AudioSettings) => void>();

export const getAudioSettings = (): AudioSettings => ({ ...settings });

export const subscribeAudio = (fn: (s: AudioSettings) => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
};

export const setAudioSettings = (patch: Partial<AudioSettings>) => {
    settings = { ...settings, ...patch };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
    applyMusicVolume();
    // Unmuting is a deliberate act, so it should be audible immediately rather than at the
    // next screen change — restart whatever track the game currently wants.
    if (!settings.muted && currentTrack && musicPool[activeMusicIdx]?.paused) void startMusic(currentTrack);
    if (settings.muted) stopMusic();
    listeners.forEach(fn => fn({ ...settings }));
};

export const toggleMute = () => setAudioSettings({ muted: !settings.muted });

// --- AUTOPLAY UNLOCK --------------------------------------------------------

let unlocked = false;
let pendingTrack: MusicTrack | null = null;

export const isAudioUnlocked = () => unlocked;

/** Wired to the first real user gesture by `installAudioUnlock()`. */
const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    preloadAll();
    if (pendingTrack) { void startMusic(pendingTrack); pendingTrack = null; }
};

export const installAudioUnlock = () => {
    if (typeof window === 'undefined') return () => {};
    const fire = () => { unlock(); teardown(); };
    const teardown = () => {
        window.removeEventListener('pointerdown', fire);
        window.removeEventListener('keydown', fire);
    };
    window.addEventListener('pointerdown', fire);
    window.addEventListener('keydown', fire);
    return teardown;
};

// --- SFX --------------------------------------------------------------------

const pools = new Map<string, { els: HTMLAudioElement[]; next: number }>();

const poolFor = (file: string) => {
    let p = pools.get(file);
    if (!p) {
        const els = Array.from({ length: POOL_SIZE }, () => {
            const el = new Audio(BASE + file);
            el.preload = 'auto';
            return el;
        });
        p = { els, next: 0 };
        pools.set(file, p);
    }
    return p;
};

const preloadAll = () => {
    Object.values(SFX).forEach(def => def.files.forEach(f => poolFor(f)));
};

/**
 * Identical sounds fired within this window collapse into one. An area-of-effect hit
 * resolves as N separate APPLY_DAMAGE actions in the same instant; without this they stack
 * into a single distorted blare that is louder than anything else in the game.
 */
const RETRIGGER_MS = 45;
const lastPlayed = new Map<SfxName, number>();

export const sfx = (name: SfxName, volumeScale = 1) => {
    if (settings.muted || typeof window === 'undefined') return;
    if (!unlocked) return;

    const def = SFX[name];
    if (!def) return;

    const now = performance.now();
    const prev = lastPlayed.get(name);
    if (prev !== undefined && now - prev < RETRIGGER_MS) return;
    lastPlayed.set(name, now);

    const file = def.files.length === 1
        ? def.files[0]
        : def.files[Math.floor(Math.random() * def.files.length)];

    const pool = poolFor(file);
    const el = pool.els[pool.next];
    pool.next = (pool.next + 1) % pool.els.length;

    el.volume = Math.min(1, def.gain * volumeScale * settings.sfx * settings.master);
    try {
        el.currentTime = 0;
        // Autoplay can still be refused (a background tab, a policy we did not predict).
        // A rejected promise here is not worth a console error on every click.
        void el.play().catch(() => {});
    } catch { /* element not ready yet; skip this one rather than throw into the turn loop */ }
};

// --- MUSIC ------------------------------------------------------------------

const musicPool: HTMLAudioElement[] = [];
let activeMusicIdx = 0;
let currentTrack: MusicTrack | null = null;
let activeFadeTimer: number | null = null;
const outFadeTimers = new Map<HTMLAudioElement, number>();

const getMusicEl = (idx: number) => {
    if (!musicPool[idx]) {
        musicPool[idx] = new Audio();
        musicPool[idx].loop = true;
    }
    return musicPool[idx];
};

const musicTargetVolume = () =>
    settings.muted ? 0 : (MUSIC[currentTrack!]?.gain ?? 0.3) * settings.music * settings.master;

const applyMusicVolume = () => {
    const el = musicPool[activeMusicIdx];
    if (el && currentTrack) el.volume = musicTargetVolume();
};

const fadeOutEl = (el: HTMLAudioElement) => {
    if (outFadeTimers.has(el)) {
        clearInterval(outFadeTimers.get(el)!);
    }
    let v = el.volume;
    const timer = window.setInterval(() => {
        v -= 0.15;
        if (v <= 0) { 
            el.pause(); 
            clearInterval(timer); 
            outFadeTimers.delete(el);
        } else {
            el.volume = Math.max(0, v);
        }
    }, 40);
    outFadeTimers.set(el, timer);
};

const startMusic = async (track: MusicTrack) => {
    const def = MUSIC[track];
    if (!def) return;

    // Fade out current playing track
    const oldEl = musicPool[activeMusicIdx];
    if (oldEl && !oldEl.paused) {
        fadeOutEl(oldEl);
    }
    
    if (activeFadeTimer !== null) {
        clearInterval(activeFadeTimer);
        activeFadeTimer = null;
    }

    // Swap to the other audio element
    activeMusicIdx = (activeMusicIdx + 1) % 2;
    const el = getMusicEl(activeMusicIdx);
    
    el.src = BASE + def.file;
    currentTrack = track;
    el.volume = 0;
    
    // Autoplay policy might block this if not unlocked
    try { 
        if (def.startTime) el.currentTime = def.startTime;
        await el.play(); 
    } catch { return; }

    const target = musicTargetVolume();
    let v = 0;
    activeFadeTimer = window.setInterval(() => {
        v = Math.min(target, v + target / 5);
        if (musicPool[activeMusicIdx] === el) el.volume = v;
        if (v >= target - 0.001) {
            if (activeFadeTimer !== null) clearInterval(activeFadeTimer);
            activeFadeTimer = null;
        }
    }, 30);
};

const stopMusic = () => {
    if (activeFadeTimer !== null) { clearInterval(activeFadeTimer); activeFadeTimer = null; }
    const el = musicPool[activeMusicIdx];
    if (el && !el.paused) {
        fadeOutEl(el);
    }
    currentTrack = null;
};

/** Idempotent: asking for the track already playing does nothing, so it is safe in an effect. */
export const playMusic = (track: MusicTrack | null) => {
    const el = musicPool[activeMusicIdx];
    if (track === currentTrack && el && !el.paused) return;

    if (track === null) { stopMusic(); return; }

    if (!unlocked) { pendingTrack = track; currentTrack = track; return; }
    void startMusic(track);
};
