
import { UnitClass, UnitDefinition } from '../types';
import { PLANT_DEFINITIONS } from './plants';
import { ZOMBIE_DEFINITIONS } from './zombies';

// Re-export constants from their new homes
export { UNIT_ROLE_MAP } from './roles';
export { UNIT_SKILLS } from './skills';
export { DEFAULT_TERRAIN_DEFS } from './terrain';
export { DEFAULT_ITEM_DEFINITIONS } from './items';
// PLAYER_ROSTER đã bỏ cùng đợt dọn cây: nó là danh sách 23 cây cho màn chọn đội của bản
// PvZ cũ, và từ lúc squad thành 3 hero thì không nơi nào đọc nó nữa.

// Merge Plants and Zombies into a single Unit Definitions object
// Casting to specific Record type to satisfy strict typing elsewhere
export const DEFAULT_UNIT_DEFINITIONS: Record<UnitClass, UnitDefinition> = {
    ...PLANT_DEFINITIONS,
    ...ZOMBIE_DEFINITIONS
} as Record<UnitClass, UnitDefinition>;
