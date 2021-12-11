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
}
