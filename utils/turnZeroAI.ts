import { Position, TerrainDefinition, TileData, Unit } from '../types';
import { findPath, getTileAt, getUnitAt } from './gameLogic';
import { planEnemyIntent } from './aiLogic';

/**
 * THE FREE ENEMY STEP BEFORE TURN 1.
 *
 * Zombies walk once as the board is handed over, so the player never opens a fight looking
 * at a wave parked on the spawn line with nothing telegraphed. It reads exactly like the
 * enemy half of processTurn but deliberately is not it: no attacks resolve, nothing takes
 * damage, and the only output is positions and intents.
 *
 * Lifted out of useGameProgression, where it was the tail of a 1200-line hook and closed
 * over `terrainDefs` for no reason other than being written there.
 *
 * @param holdPositions Scripted battles pass true: the opening positions are authored, and
 *        a free move before turn 1 would put the zombies somewhere the script did not plan
 *        for — which breaks every "click that tile" instruction the tutorial gives.
 *        Intents are still planned, so the telegraph is correct from the first frame.
 */
export const performTurnZeroAI = (
    currentUnits: Unit[],
    currentBoard: TileData[],
    terrainDefs: Record<string, TerrainDefinition>,
    holdPositions = false,
): Unit[] => {
    const activeUnits = currentUnits.filter(u => u.position.x >= 0); // Ignore benched
    const nonEnemies = activeUnits.filter(u => !u.isEnemy);
    const enemies = activeUnits.filter(u => u.isEnemy);
    const finalUnits = [...nonEnemies];

    for (const enemy of enemies) {
        const attackSpots: Position[] = [];
        nonEnemies.forEach(p => {
            const neighbors = [
                { x: p.position.x + 1, y: p.position.y }, { x: p.position.x - 1, y: p.position.y },
                { x: p.position.x, y: p.position.y + 1 }, { x: p.position.x, y: p.position.y - 1 },
            ];
            neighbors.forEach(n => {
                const t = getTileAt(n, currentBoard);
                if (t && terrainDefs[t.terrain].isWalkable) attackSpots.push(n);
            });
        });

        let bestPath: Position[] | null = null;
        let minLen = 9999;
        attackSpots.sort((a, b) =>
            (Math.abs(a.x - enemy.position.x) + Math.abs(a.y - enemy.position.y))
            - (Math.abs(b.x - enemy.position.x) + Math.abs(b.y - enemy.position.y)));
        const candidates = attackSpots.slice(0, 5);
        const collisionLayer = [...finalUnits, ...enemies.filter(e => e.id !== enemy.id)];

        for (const target of candidates) {
            const path = findPath(enemy, target, collisionLayer, currentBoard, terrainDefs);
            if (path.length > 0 && path.length < minLen) {
                minLen = path.length;
                bestPath = path;
                if (minLen <= 1) break;
            }
        }

        let finalPos = enemy.position;
        if (!holdPositions && bestPath && bestPath.length > 0) {
            const canMoveSteps = Math.min(enemy.moveRange, bestPath.length);
            for (let step = canMoveSteps - 1; step >= 0; step--) {
                const dest = bestPath[step];
                if (!getUnitAt(dest, collisionLayer)) {
                    finalPos = dest;
                    break;
                }
            }
        }

        const updatedEnemy = { ...enemy, position: finalPos };
        // Pass the board through: without it planEnemyIntent can't see where the houses are
        // and falls back to a straight-line telegraph, which would lie to the player.
        updatedEnemy.intent = planEnemyIntent(updatedEnemy, nonEnemies, currentBoard, terrainDefs, collisionLayer);
        finalUnits.push(updatedEnemy);
    }

    // Return all units (including benched ones that were filtered out at start)
    const benched = currentUnits.filter(u => u.position.x < 0);
    return [...finalUnits, ...benched];
};
