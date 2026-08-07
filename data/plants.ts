
import { UnitClass, UnitDefinition } from '../types';
import { ICONS } from '../utils/icons';

/**
 * CÂY THƯỜNG — mọi thân cây KHÔNG phải hero mà bàn cờ có thể sinh ra.
 *
 * Bảng này từng có 28 cây, di sản của bản PvZ đầu tiên: shop bán cây, cây lên cấp, cây tiến
 * hoá. Không còn thứ nào trong ba thứ đó tồn tại — squad bây giờ là 3 hero (data/heroes.ts)
 * cộng ghế dự bị lấy từ nguyên liệu (data/materials.ts), sức mạnh mọc lên bằng hợp nhất và
 * nguyên tố. Mười chín cây kia KHÔNG CÒN ĐƯỜNG NÀO vào được trận và đã bị bỏ.
 *
 * Mười entry còn lại, và LÝ DO từng cái còn — đây là danh sách kiểm tra khi định thêm cây
 * mới; thêm một entry mà không mở được một trong hai cửa dưới đây là lại đẻ ra rác:
 *
 *   1. CHÍN cây gốc của hero — SEED_GUN, ARMOR_PLATE, SOL_BATTERY, STEEL_JAWS, CORN_MORTAR, ROTOR_WING,
 *      SPIKE_ARMOR, SPRING_ARM, BUNKER_SHELL. Vừa là `baseClass` của một hero vừa là `benchClass`
 *      của nguyên liệu cùng tên, tức là thân cây mà mầm dự bị mang ra sân. Đủ CHÍN, không
 *      phải tám: Rotor Wing từng thiếu ở đây và đó là lỗi, không phải chủ ý — xem chú thích
 *      tại chỗ khai nó.
 *   2. GEAR_CRATE — không phải cây, là cái thùng của nhiệm vụ hộ tống.
 *
 * CACTUS và ICE_GRENADE từng sống nhờ WILD_POOL của encounterBuilder (cây hoang mọc sẵn trên
 * bàn). Cây hoang đã QUAY LẠI 2026-08-06 với pool = 9 thân cây material của hero (xem WILD_POOL) — riêng CACTUS và ICE_GRENADE vẫn bỏ.
 *
 * `evolvesTo`/`evolutionCost` cũng đi theo: mọi đích tiến hoá đều nằm trong nhóm bị xoá, và
 * bản thân cơ chế tiến hoá tiêu Sol trên bản đồ trong khi Sol là tài nguyên trong-một-trận —
 * việc nó từng làm giờ thuộc về hợp nhất và nguyên tố.
 */
export const PLANT_DEFINITIONS: Partial<Record<UnitClass, UnitDefinition>> = {
    [UnitClass.SEED_GUN]: {
        class: UnitClass.SEED_GUN, name: 'Seed Gun', maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: ICONS.SEED_GUN,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 6, dmg: 4, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 100, move: 75, cdr: 150 },
    },
    /**
     * THE GEAR CRATE (ESCORT_GEAR).
     *
     * 8 HP and nothing else: no damage, no move, no skills. It is not meant to survive on its
     * own — 8 is roughly three ordinary bites, which is how long the squad has to get across
     * the board and stand in front of it. Making it tougher would turn the objective into
     * "ignore it and win"; making it thinner would turn it into "lose on turn two".
     *
     * `PUSH` immunity because it is a crate, and because a shove that slid the objective into
     * the sea would be a loss the player could inflict on themselves by accident with their
     * own hero.
     */
    [UnitClass.GEAR_CRATE]: {
        class: UnitClass.GEAR_CRATE, name: 'Gear Crate', maxHp: 8, damage: 0, moveRange: 0,
        imgUrl: ICONS.GEAR_CRATE,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 0,
        maxStats: { hp: 8, dmg: 0, move: 0, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 },
    },
    [UnitClass.ARMOR_PLATE]: {
        class: UnitClass.ARMOR_PLATE, name: 'Armor Plate', maxHp: 6, damage: 2, moveRange: 2,
        imgUrl: ICONS.ARMOR_PLATE,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 50,
        maxStats: { hp: 10, dmg: 4, move: 4, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 100, move: 100, cdr: 150 },
    },
    [UnitClass.SPIKE_ARMOR]: {
        class: UnitClass.SPIKE_ARMOR, name: 'Spike Armor', maxHp: 8, damage: 2, moveRange: 1,
        imgUrl: ICONS.SPIKE_ARMOR,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 125,
        maxStats: { hp: 15, dmg: 4, move: 3, cdr: 2 },
        upgradeCosts: { hp: 80, dmg: 120, move: 100, cdr: 200 }
    },
    [UnitClass.BUNKER_SHELL]: {
        class: UnitClass.BUNKER_SHELL, name: 'Bunker Shell', maxHp: 6, damage: 0, moveRange: 2,
        imgUrl: ICONS.BUNKER_SHELL,
        movementType: 'WALKING', immunities: [],
        cost: 125,
        maxStats: { hp: 10, dmg: 0, move: 4, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 0, move: 100, cdr: 150 }
    },
    // The pusher. Damage 0 is the identity, not a gap: it relocates bodies and lets the
    // terrain do the killing, so move 3 (to reach the shove) matters more than any dmg stat.
    // dmg is capped at 0 for the same reason — upgrading it would erase what it is.
    [UnitClass.SPRING_ARM]: {
        class: UnitClass.SPRING_ARM, name: 'Spring Arm', maxHp: 5, damage: 0, moveRange: 3,
        imgUrl: ICONS.SPRING_ARM,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 9, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 0, move: 90, cdr: 150 }
    },
    [UnitClass.STEEL_JAWS]: {
        class: UnitClass.STEEL_JAWS, name: 'Steel Jaws', maxHp: 5, damage: 10, moveRange: 3,
        imgUrl: ICONS.STEEL_JAWS,
        movementType: 'WALKING', immunities: [],
        cost: 150,
        maxStats: { hp: 8, dmg: 10, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 200, move: 100, cdr: 150 }
    },
    /**
     * ROTOR WING — thân cây gốc của Reedwing, và cái entry từng THIẾU ở bảng này.
     *
     * Nó vắng mặt không phải vì mầm dự bị không cần (buildBenchUnit dựng mầm từ `benchStats`
     * của nguyên liệu), mà vì không ai để ý: mọi UI tra `unitDefs[unit.class]` để lấy tên hay
     * chỉ số của một hero đều nhận undefined cho Reedwing, và bảng Đội Hình bỏ qua thẻ của cô
     * ấy trong im lặng (`if (!def) return null`). Chỉ số chép đúng `benchStats` của
     * MAT_REEDWING để hai chỗ không nói khác nhau.
     */
    [UnitClass.ROTOR_WING]: {
        class: UnitClass.ROTOR_WING, name: 'Rotor Wing', maxHp: 2, damage: 2, moveRange: 3,
        imgUrl: ICONS.ROTOR_WING,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 6, dmg: 4, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 100, move: 75, cdr: 150 },
    },
    [UnitClass.CORN_MORTAR]: {
        class: UnitClass.CORN_MORTAR, name: 'Corn Mortar', maxHp: 4, damage: 1, moveRange: 3,
        imgUrl: ICONS.CORN_MORTAR,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 7, dmg: 5, move: 5, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 110, move: 90, cdr: 150 }
    },
    [UnitClass.SOL_BATTERY]: {
        class: UnitClass.SOL_BATTERY, name: 'Sol Battery', maxHp: 3, damage: 0, moveRange: 3,
        imgUrl: ICONS.SOL_BATTERY,
        movementType: 'WALKING', immunities: [],
        cost: 50,
        maxStats: { hp: 6, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 75, cdr: 150 },
    },
};
