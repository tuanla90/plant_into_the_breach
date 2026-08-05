/**
 * Copies the chosen sound files out of the downloaded CC0 packs into `public/audio/`
 * under semantic names, so `utils/audio.ts` never has to know what a pack is called.
 *
 * Sources (all CC0, verified on the authors' own itch.io pages — see /CREDITS.md):
 *   Comigo's Bleeps and Bloops   - retro SFX, carries the combat layer
 *   Comigo's Short Music Loops   - background music
 *   CoMiGo's Simple Jingles      - stingers
 *   Cici Fyre's Natural UI SFX   - the one organic click, for UI
 *   Kenney's RPG Audio           - coins and latches, for the meta screens
 *
 * Re-run after changing PICKS. Set SRC to wherever the packs were unpacked.
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.env.AUDIO_SRC
    || 'D:/Users/tuanla2/AppData/Local/Temp/claude/D--Users-tuanla2-game/71a63709-2d1a-443a-9430-15b626cce6e2/scratchpad/bundled-assets-main/sounds';
const OUT = join(import.meta.dirname, '..', 'public', 'audio');

const BLEEPS = "Comigo's Bleeps";
const MUSIC = "Comigo's Music Loops";
const JINGLE = "CoMiGo's Jingles";
const UI = 'Natural UI SFX Pack';
const RPG = "Kenney's RPG Sounds";

// destination name -> [pack, source file]
const PICKS = {
    // --- UI -------------------------------------------------------------
    'ui-click':      [UI, 'MouseClick.wav'],
    'ui-select':     [BLEEPS, 'Press_02.wav'],
    'ui-back':       [BLEEPS, 'Press_04.wav'],
    'ui-coin':       [RPG, 'HandleCoins_01.mp3'],
    'ui-item':       [RPG, 'MetalClick.mp3'],

    // --- Movement (randomised, so repeated steps do not sound like a loop) ---
    'step-1':        [BLEEPS, 'Step_Soft_01.wav'],
    'step-2':        [BLEEPS, 'Step_Soft_02.wav'],
    'step-3':        [BLEEPS, 'Step_Soft_03.wav'],

    // --- Attacks --------------------------------------------------------
    'attack-melee':  [BLEEPS, 'Impact_01.wav'],
    'attack-shot':   [BLEEPS, 'Shoot_02.wav'],
    'attack-lob':    [BLEEPS, 'ZapLauncher_01.wav'],
    'skill-cast':    [BLEEPS, 'PowerZap_01.wav'],
    'skill-ult':     [BLEEPS, 'HeavyZap.wav'],

    // --- Impacts --------------------------------------------------------
    'hit-1':         [BLEEPS, 'SmallImpact_01.wav'],
    'hit-2':         [BLEEPS, 'SmallImpact_02.wav'],
    'hit-3':         [BLEEPS, 'SmallImpact_03.wav'],
    'hit-heavy':     [BLEEPS, 'BlastImpact_02.wav'],
    'hit-freeze':    [BLEEPS, 'EnergyZap.wav'],
    'hit-blocked':   [BLEEPS, 'MetalBars_02.wav'],
    // A deep downward whump. No pack here has a real splash, and this reads as 'went under'
    // far better than any of the impact samples do.
    'drown':         [BLEEPS, 'GravityBomb_01.wav'],
    'heal':          [BLEEPS, 'PowerUp_02.wav'],

    // --- The nine-hero mechanics ----------------------------------------
    // Every one of these was silent until now: the heroes that shove, taunt, shield and arc
    // shipped without a sound, so the two loudest tools in the game (a shove that drowns a
    // zombie, a taunt that turns the whole horde around) played as nothing at all.
    //
    // A shove is a body LEAVING, not an impact — the impact samples all read as "hit and
    // stayed". Bounce is the only one in the pack that reads as knocked away.
    'push':          [BLEEPS, 'Bounce.wav'],
    // Sibling of brain-lost's Alarm_01 on purpose: both sounds mean "every zombie look here",
    // and a taunt is the player choosing to make that happen.
    'taunt':         [BLEEPS, 'Alarm_02.wav'],
    // Blades coming out. The spikes are LAID by this sound; walking into them afterwards is an
    // ordinary hit and already plays one.
    'spikes':        [RPG, 'DrawKnife_01.mp3'],
    // Sibling of hit-blocked's MetalBars_02, so granting a shield and that shield absorbing a
    // blow rhyme — the player hears them as the same system.
    'shield':        [BLEEPS, 'MetalBars_01.wav'],
    // The lightning element's chain. Distinct from skill-cast (PowerZap) and attack-lob
    // (ZapLauncher) so an arc is never mistaken for the attack that spawned it.
    'arc':           [BLEEPS, 'ElectroZap.wav'],

    // --- Deaths ---------------------------------------------------------
    'die-enemy':     [BLEEPS, 'Break_01.wav'],
    'die-plant':     [BLEEPS, 'BreakGlass_02.wav'],

    // --- Board events ---------------------------------------------------
    'spawn':         [BLEEPS, 'GravityBomb_02.wav'],
    'turn-start':    [BLEEPS, 'Radar_03.wav'],
    'gain-sun':      [BLEEPS, 'PowerUp_01.wav'],
    'brain-lost':    [BLEEPS, 'Alarm_01.wav'],

    // --- Stingers -------------------------------------------------------
    'victory':       [JINGLE, 'Synth_05.mp3'],
    'defeat':        [BLEEPS, 'Shutdown.wav'],
    'fusion':        [BLEEPS, 'SonicSpeed.wav'],

    // --- Music ----------------------------------------------------------
    // Chosen for the setting: menus uneasy, the campaign map decaying-neon, combat driving.
    'music-menu':    [MUSIC, 'Music_Unease.mp3'],
    // The prologue comic gets its own track. It shares a screen with the main menu, so
    // without this the story plays under the menu loop and reads as a pause, not a scene.
    'music-intro':   [MUSIC, 'Music_StaringAtReflections.mp3'],
    'music-map':     [MUSIC, 'Music_NeonDecay.mp3'],
    'music-combat':  [MUSIC, 'Music_DeterminedStart.mp3'],
};

mkdirSync(OUT, { recursive: true });

let copied = 0, total = 0, missing = [];
for (const [name, [pack, file]] of Object.entries(PICKS)) {
    const from = join(SRC, pack, file);
    if (!existsSync(from)) { missing.push(`${pack}/${file}`); continue; }
    const ext = file.slice(file.lastIndexOf('.'));
    const to = join(OUT, name + ext);
    copyFileSync(from, to);
    const kb = statSync(to).size / 1024;
    total += kb; copied++;
    console.log(`${(name + ext).padEnd(20)} ${kb.toFixed(0).padStart(5)} KB   <- ${pack}/${file}`);
}
console.log(`\n${copied} files, ${(total / 1024).toFixed(1)} MB`);
if (missing.length) console.log('MISSING:\n  ' + missing.join('\n  '));
