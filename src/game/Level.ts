import { PLAYER_AI } from "./AI/PlayerAI";
import { SpaceShip } from "./SpaceShip";
import SpaceshipIntent from "./SpaceshipIntent";

export interface Level {
    player: SpaceShip;
    playerIntent: SpaceshipIntent;
    enemies: SpaceShip[];
}

export function initLevel(level: Level): void {
    level.enemies.forEach(enemy => enemy.level = level);
    level.player.level = level;
    level.player.ai = PLAYER_AI
}
export function updateLevel(level: Level, delta: number): void {
    level.player.update( delta);
    level.enemies.forEach(enemy => enemy.update( delta));
    resolveCollisions(level);
}
function resolveCollisions(level: Level) {
    const ships:SpaceShip[] = [].concat(level.enemies, [level.player]);
    for (let i = 0; i < ships.length; i++) {
        for (let j = i + 1; j < ships.length; j++) {
            const collision = ships[i].collidesWith(ships[j]);
            if (collision) {
                ships[i].onCollision(collision);
                ships[j].onCollision({
                    ...collision,
                    normal: {
                        x: -collision.normal.x,
                        y: -collision.normal.y
                    },
                });
            }
        }
    }
}

