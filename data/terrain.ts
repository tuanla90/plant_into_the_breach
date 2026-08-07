
import { TerrainDefinition } from '../types';

export const DEFAULT_TERRAIN_DEFS: Record<string, TerrainDefinition> = {
    'GRASS': { 
        type: 'GRASS', name: 'Lawn', description: 'Standard terrain.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#3c7826', textureUrl: './img/terrain/grass.svg' 
    },
    'WATER': { 
        type: 'WATER', name: 'Water', description: 'Impassable for walkers. Drowns non-aquatic.', isWalkable: false, isFlyingOnly: false,
        baseColor: '#1e3a8a', textureUrl: './img/terrain/water.svg'
    },
    'CONCRETE': { 
        type: 'CONCRETE', name: 'Concrete', description: 'Hard ground.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#374151', textureUrl: './img/terrain/concrete.svg'
    },
    'LAVA': { 
        type: 'LAVA', name: 'Lava', description: 'Applies BURN. Deals damage.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#7f1d1d', textureUrl: './img/terrain/lava.svg'
    },
    'ICE': { 
        type: 'ICE', name: 'Ice Sheet', description: 'Slippery! Units slide.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#bae6fd', textureUrl: './img/terrain/ice.svg'
    },
    'SAND': { 
        type: 'SAND', name: 'Sand', description: 'Soft ground.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#eab308', textureUrl: './img/terrain/sand.svg'
    },
    'MOUNTAIN': { 
        type: 'MOUNTAIN', name: 'Mountain', description: 'Blocks movement and projectiles.', isWalkable: false, isFlyingOnly: true,
        baseColor: '#4b5563', textureUrl: './img/terrain/mountain.svg'
    },
    'POWER_TILE': { 
        type: 'POWER_TILE', name: 'Power Tile', description: 'Boosts attack damage by +1.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#581c87', textureUrl: './img/terrain/power-tile.svg' 
    },
    'SMOKE': { 
        type: 'SMOKE', name: 'Smoke Screen', description: 'Blinds units. Cancels attacks.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#4b5563', textureUrl: './img/terrain/smoke.svg'
    },
    'FIRE': { 
        type: 'FIRE', name: 'Blaze', description: 'Intense fire. Deals 2 DMG & Burns.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#ef4444', textureUrl: './img/terrain/fire.svg'
    },
    'WALL': {
        type: 'WALL', name: 'Barrier', description: 'Solid. Nothing crosses it — not even flyers.', isWalkable: false, isFlyingOnly: false,
        baseColor: '#1f2937', textureUrl: './img/terrain/wall.svg'
    },
    'BRIDGE': {
        type: 'BRIDGE', name: 'Bridge', description: 'A dry crossing over the water.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#78502e', textureUrl: './img/terrain/bridge.svg'
    },
    'RAIL': {
        type: 'RAIL', name: 'Minecart Track', description: 'Walkable rail line.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#57534e', textureUrl: './img/terrain/rail.svg'
    },
    'GRAVE_DIRT': {
        type: 'GRAVE_DIRT', name: 'Grave Dirt', description: 'Slows units when unkempt.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#78350f', textureUrl: './img/terrain/grave_dirt.svg'
    },
    'CONVEYOR_N': {
        type: 'CONVEYOR_N', name: 'Conveyor (North)', description: 'Moves units North automatically.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#10b981', textureUrl: './img/terrain/conveyor_n.svg'
    },
    'CONVEYOR_S': {
        type: 'CONVEYOR_S', name: 'Conveyor (South)', description: 'Moves units South automatically.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#10b981', textureUrl: './img/terrain/conveyor_s.svg'
    },
    'CONVEYOR_E': {
        type: 'CONVEYOR_E', name: 'Conveyor (East)', description: 'Moves units East automatically.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#10b981', textureUrl: './img/terrain/conveyor_e.svg'
    },
    'CONVEYOR_W': {
        type: 'CONVEYOR_W', name: 'Conveyor (West)', description: 'Moves units West automatically.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#10b981', textureUrl: './img/terrain/conveyor_w.svg'
    },
    'SURGE_NODE': {
        type: 'SURGE_NODE', name: 'Surge Node', description: 'Conducts electricity to adjacent tiles.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#facc15', textureUrl: './img/terrain/surge_node.svg'
    },
    'BLIGHT': {
        type: 'BLIGHT', name: 'Blight', description: 'Corrupts land. Steals MAX HP.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#14b8a6', textureUrl: './img/terrain/blight.svg'
    },
    'THIN_ICE': {
        type: 'THIN_ICE', name: 'Thin Ice', description: 'Cracks when stepped on.', isWalkable: true, isFlyingOnly: false,
        baseColor: '#7dd3fc', textureUrl: './img/terrain/thin_ice.svg'
    },
    'NONE': {
        type: 'NONE', name: '', description: '', isWalkable: true, isFlyingOnly: false,
        baseColor: 'transparent'
    }
};
