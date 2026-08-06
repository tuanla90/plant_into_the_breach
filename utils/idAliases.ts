/**
 * ID MIGRATION — đợt đổi ID nội bộ 2026-08-06 (NAMING.md, Phase 2).
 *
 * Mọi ID cũ từng nằm trong localStorage: `pitb_progress_v1` giữ heroes[] / bossesBeaten[] /
 * recipes["HERO:MAT"], `pitb_run_v1` giữ unit.heroId / unit.class / inventory[itemId] /
 * heroElements{heroId}, `pitb_balance_v1` giữ path "hero.<id>.<field>". Đổi ID trong code mà
 * không dịch save là xoá tiến trình người chơi trong im lặng — CLAUDE.md cấm đúng điều đó.
 *
 * Các bảng này CHỈ được đọc ở biên nạp save (persistence / runPersistence / balance).
 * Đừng import chúng vào logic game: code mới phải dùng thẳng ID mới.
 */

const HERO_ID_ALIASES: Record<string, string> = {
    GREEN_SHADOW: 'PEABURST',
    WALL_KNIGHT: 'IRONHUSK',
    SOLAR_FLARE: 'SUNBLOOM',
    CHOMPZILLA: 'SNAPMAW',
    KERNEL_PULT: 'CORNOVA',
    ZEPHYR: 'REEDWING',
    THORNHIDE: 'THORNSHELL',
    CHARDWALL: 'CHARDSLAM',
};

const CLASS_ALIASES: Record<string, string> = {
    PEASHOOTER: 'SEED_GUN',
    SUNFLOWER: 'SOL_BATTERY',
    WALLNUT: 'ARMOR_PLATE',
    CHOMPER: 'STEEL_JAWS',
    KERNEL_PULT: 'CORN_MORTAR',
    CATTAIL: 'ROTOR_WING',
    ENDURIAN: 'SPIKE_ARMOR',
    CHARD_GUARD: 'SPRING_ARM',
    PUMPKIN: 'BUNKER_SHELL',
    BASIC_ZOMBIE: 'WALKER',
    CONEHEAD: 'SCRAPCAP',
    BUCKETHEAD: 'POTHELM',
    NEWSPAPER_ZOMBIE: 'TATTERGUARD',
    SCREEN_DOOR_ZOMBIE: 'DOORBEARER',
    DIGGER_ZOMBIE: 'MINER',
    FOOTBALL_ZOMBIE: 'LINEBREAKER',
    POLE_VAULTER: 'LEAPER',
    DISCO_ZOMBIE: 'DANCER',
    BALLOON_ZOMBIE: 'FLOATER',
    CATAPULT_ZOMBIE: 'LOBBER',
    FLAG_ZOMBIE: 'BANNERMAN',
    IMP: 'RUNT',
    GARGANTUAR: 'GRAVEHULK',
    DISCO_ZOMBOSS: 'HEADLINER',
};

const BOSS_ID_ALIASES: Record<string, string> = {
    GARGANTUAR: 'GRAVEHULK',
    DISCO_ZOMBOSS: 'HEADLINER',
    CATAPULT_LORD: 'IRONCART',
    BALLOON_ARMADA: 'ARMADA',
};

const MATERIAL_ID_ALIASES: Record<string, string> = {
    MAT_PEASHOOTER: 'MAT_SEED_GUN',
    MAT_SUNFLOWER: 'MAT_SOL_BATTERY',
    MAT_WALLNUT: 'MAT_ARMOR_PLATE',
    MAT_CHOMPER: 'MAT_STEEL_JAWS',
    MAT_CORN: 'MAT_CORN_MORTAR',
    MAT_CATTAIL: 'MAT_ROTOR_WING',
    MAT_ENDURIAN: 'MAT_SPIKE_ARMOR',
    MAT_CHARD: 'MAT_SPRING_ARM',
    MAT_PUMPKIN: 'MAT_BUNKER_SHELL',
};

const ITEM_ID_ALIASES: Record<string, string> = {
    potato_mine: 'seed_mine',
    cherry_bomb: 'fire_grenade',
    jalapeno: 'flame_strike',
    snow_pea: 'ice_grenade',
    coffee_bean: 'stim_shot',
    blover: 'storm_fan',
    spikeweed: 'spike_trap',
    hypno_shroom: 'brainwash_dart',
    magnet_shroom: 'magnet_pulse',
    doom_shroom: 'blight_core',
    aloe: 'heal_kit',
};

const SKILL_ID_ALIASES: Record<string, string> = {
    butter_splat: 'nova_shell',
    kp_butter_splat: 'kp_nova_shell',
    basketball_lob: 'boulder_lob',
    imp_toss: 'runt_toss',
    cone_smash: 'scrap_smash',
    bucket_smash: 'pot_smash',
    goop: 'sap_snare',
    caffeine_boost: 'stim_boost',
};

export const aliasHeroId = (id: string): string => HERO_ID_ALIASES[id] ?? id;
export const aliasClassId = (id: string): string => CLASS_ALIASES[id] ?? id;
export const aliasBossId = (id: string): string => BOSS_ID_ALIASES[id] ?? id;
export const aliasMaterialId = (id: string): string => MATERIAL_ID_ALIASES[id] ?? id;
export const aliasItemId = (id: string): string => ITEM_ID_ALIASES[id] ?? id;
export const aliasSkillId = (id: string): string => SKILL_ID_ALIASES[id] ?? id;

/** "HERO:MAT" recipe keys trong pitb_progress_v1 — dịch cả hai vế. */
export const aliasRecipeKey = (key: string): string => {
    const i = key.indexOf(':');
    if (i < 0) return key;
    return `${aliasHeroId(key.slice(0, i))}:${aliasMaterialId(key.slice(i + 1))}`;
};

/**
 * Path của pitb_balance_v1 có dạng "<kind>.<id>.<field>" — dịch đoạn giữa theo kind.
 * Kind lạ thì trả nguyên vẹn (triết lý của balance.ts: lệch thì bỏ, default đứng).
 */
export const aliasBalancePath = (path: string): string => {
    const parts = path.split('.');
    if (parts.length < 3) return path;
    const [kind, id] = parts;
    const mapped =
        kind === 'hero' ? aliasHeroId(id) :
        kind === 'skill' ? aliasSkillId(id) :
        kind === 'unit' ? aliasClassId(id) :
        kind === 'material' ? aliasMaterialId(id) :
        id;
    if (mapped === id) return path;
    return [kind, mapped, ...parts.slice(2)].join('.');
};
