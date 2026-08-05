
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
    'NONE': {
        type: 'NONE', name: '', description: '', isWalkable: true, isFlyingOnly: false,
        baseColor: 'transparent'
    }
};
