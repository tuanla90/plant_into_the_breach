
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
    // TACTICAL rather than MELEE: it stands in the front line but deals no damage there.
    // Everything it is worth comes from where the enemy ENDS UP, which is this column's job.
    [UnitClass.CHARD_GUARD]: 'TACTICAL',

    // SUPPORT (Economy & Buffs)
    [UnitClass.SUN_SHROOM]: 'SUPPORT',
    [UnitClass.PUMPKIN]: 'SUPPORT',
    [UnitClass.SUNFLOWER]: 'SUPPORT',
    [UnitClass.TWIN_SUNFLOWER]: 'SUPPORT',
    [UnitClass.COFFEE_BEAN]: 'SUPPORT', // Refresh Turn
    [UnitClass.TORCHWOOD]: 'SUPPORT', // Fire Environment
    
    // ENEMY
    [UnitClass.GEAR_CRATE]: 'TACTICAL',
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
    [UnitClass.DISCO_ZOMBOSS]: 'ENEMY',
    [UnitClass.CINDER_COLOSSUS]: 'ENEMY',
    [UnitClass.VOLTMAW]: 'ENEMY',
    [UnitClass.YETI]: 'ENEMY',
    [UnitClass.IRONCART]: 'ENEMY',
    [UnitClass.CLOCKJAW]: 'ENEMY',
    [UnitClass.BLIGHTLORD]: 'ENEMY',
    [UnitClass.ARMADA]: 'ENEMY',
    [UnitClass.SANDREAVER]: 'ENEMY',
    [UnitClass.GARGANTUAR]: 'ENEMY', 
    [UnitClass.IMP]: 'ENEMY', 
    [UnitClass.ROCK]: 'ENEMY',
    [UnitClass.GRAVE]: 'ENEMY',
};
