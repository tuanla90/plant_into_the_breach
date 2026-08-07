
import { UnitClass, UnitRole } from '../types';

export const UNIT_ROLE_MAP: Record<UnitClass, UnitRole> = {
    // SHOOTER (Ranged Damage Dealers)
    [UnitClass.SEED_GUN]: 'SHOOTER',
    [UnitClass.ROTOR_WING]: 'SHOOTER',

    // MELEE (Defenders/Tanks & Melee Fighters)
    [UnitClass.ARMOR_PLATE]: 'MELEE',
    [UnitClass.SPIKE_ARMOR]: 'MELEE',
    [UnitClass.STEEL_JAWS]: 'MELEE',

    // TACTICAL (Board Control & Debuffs)
    [UnitClass.CORN_MORTAR]: 'TACTICAL', // Stuns
    // TACTICAL rather than MELEE: it stands in the front line but deals no damage there.
    // Everything it is worth comes from where the enemy ENDS UP, which is this column's job.
    [UnitClass.SPRING_ARM]: 'TACTICAL',

    // SUPPORT (Economy & Buffs)
    [UnitClass.BUNKER_SHELL]: 'SUPPORT',
    [UnitClass.SOL_BATTERY]: 'SUPPORT',


    // ENEMY
    [UnitClass.GEAR_CRATE]: 'TACTICAL',
    [UnitClass.WALKER]: 'ENEMY',
    [UnitClass.SCRAPCAP]: 'ENEMY', 
    [UnitClass.POTHELM]: 'ENEMY',
    [UnitClass.TATTERGUARD]: 'ENEMY', 
    [UnitClass.DOORBEARER]: 'ENEMY', 
    [UnitClass.MINER]: 'ENEMY', 
    [UnitClass.LINEBREAKER]: 'ENEMY',
    [UnitClass.LEAPER]: 'ENEMY',
    [UnitClass.DANCER]: 'ENEMY',
    [UnitClass.FLOATER]: 'ENEMY',
    [UnitClass.LOBBER]: 'ENEMY',
    [UnitClass.BANNERMAN]: 'ENEMY',
    [UnitClass.HEADLINER]: 'ENEMY',
    [UnitClass.CINDER_COLOSSUS]: 'ENEMY',
    [UnitClass.VOLTMAW]: 'ENEMY',
    [UnitClass.YETI]: 'ENEMY',
    [UnitClass.IRONCART]: 'ENEMY',
    [UnitClass.CLOCKJAW]: 'ENEMY',
    [UnitClass.BLIGHTLORD]: 'ENEMY',
    [UnitClass.ARMADA]: 'ENEMY',
    [UnitClass.SANDREAVER]: 'ENEMY',
    [UnitClass.GRAVEHULK]: 'ENEMY', 
    [UnitClass.RUNT]: 'ENEMY', 
    [UnitClass.ROCK]: 'ENEMY',
    [UnitClass.GRAVE]: 'ENEMY',
    // Vật cản trên bàn, không phải thân biết đánh — cùng cửa với ROCK/GRAVE. Enum
    // `BARREL_PROP` khai từ trước mà chưa ô nào sinh ra nó; entry này chỉ để bảng phủ đủ
    // `UnitClass` (thiếu nó là typecheck đỏ). Nếu cuối cùng không dùng, xoá cả enum lẫn đây.
    [UnitClass.BARREL_PROP]: 'ENEMY',
};
