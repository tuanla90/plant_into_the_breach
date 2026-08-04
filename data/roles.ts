
import { UnitClass, UnitRole } from '../types';

export const UNIT_ROLE_MAP: Record<UnitClass, UnitRole> = {
    // SHOOTER (Ranged Damage Dealers)
    [UnitClass.PEASHOOTER]: 'SHOOTER',
    [UnitClass.REPEATER]: 'SHOOTER',
    [UnitClass.BLOOMERANG]: 'SHOOTER',
    [UnitClass.CACTUS]: 'SHOOTER',
    [UnitClass.MELON_PULT]: 'SHOOTER',
    [UnitClass.CABBAGE_PULT]: 'SHOOTER', 
    [UnitClass.SCAREDY_SHROOM]: 'SHOOTER',

    // MELEE (Defenders/Tanks & Melee Fighters)
    [UnitClass.WALLNUT]: 'MELEE',
    [UnitClass.TALL_NUT]: 'MELEE',
    [UnitClass.ENDURIAN]: 'MELEE',
    [UnitClass.SWEET_POTATO]: 'MELEE',
    [UnitClass.IRON_NUT]: 'MELEE',
    [UnitClass.CHOMPER]: 'MELEE',
    [UnitClass.BONK_CHOY]: 'MELEE',

    // TACTICAL (Board Control & Debuffs)
    [UnitClass.SNOW_PEA]: 'TACTICAL', // Slows/Freezes
    [UnitClass.KERNEL_PULT]: 'TACTICAL', // Stuns/Butter
    [UnitClass.MAGNET_SHROOM]: 'TACTICAL', // Pulls/Disarms
    [UnitClass.HYPNO_SHROOM]: 'TACTICAL', // Controls Enemies
    [UnitClass.BLOVER]: 'TACTICAL', // Global Push
    [UnitClass.UMBRELLA_LEAF]: 'TACTICAL', // Radial Push

    // SUPPORT (Economy & Buffs)
    [UnitClass.SUN_SHROOM]: 'SUPPORT',
    [UnitClass.PUMPKIN]: 'SUPPORT',
    [UnitClass.SUNFLOWER]: 'SUPPORT',
    [UnitClass.TWIN_SUNFLOWER]: 'SUPPORT',
    [UnitClass.COFFEE_BEAN]: 'SUPPORT', // Refresh Turn
    [UnitClass.TORCHWOOD]: 'SUPPORT', // Fire Environment
    
    // ENEMY
    [UnitClass.BASIC_ZOMBIE]: 'ENEMY',
    [UnitClass.CONEHEAD]: 'ENEMY', 
    [UnitClass.BUCKETHEAD]: 'ENEMY',
    [UnitClass.NEWSPAPER_ZOMBIE]: 'ENEMY', 
    [UnitClass.SCREEN_DOOR_ZOMBIE]: 'ENEMY', 
    [UnitClass.DIGGER_ZOMBIE]: 'ENEMY', 
    [UnitClass.FOOTBALL_ZOMBIE]: 'ENEMY',
    [UnitClass.POLE_VAULTER]: 'ENEMY',
    [UnitClass.DISCO_ZOMBIE]: 'ENEMY',
    [UnitClass.BALLOON_ZOMBIE]: 'ENEMY',
    [UnitClass.CATAPULT_ZOMBIE]: 'ENEMY',
    [UnitClass.FLAG_ZOMBIE]: 'ENEMY',
    [UnitClass.GARGANTUAR]: 'ENEMY', 
    [UnitClass.IMP]: 'ENEMY', 
    [UnitClass.ROCK]: 'ENEMY',
    [UnitClass.GRAVE]: 'ENEMY',
};
