import { PLAYER_AI } from "./AI/PlayerAI";
import Collision from "./Collision";
import { SpaceShip } from "./SpaceShip";
import SpaceshipIntent from "./SpaceshipIntent";
import { getNormalized } from "./Vector2";
import Component, { UNIT_SCALE } from "/Users/kaisalmon/Documents/Phaser/StarsAndDoubloons/src/game/Component/index";

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
            const collisionResult = ships[i].collidesWith(ships[j]);
            if (collisionResult) {
                resolveCollission(collisionResult, ships[i],ships[j]);
            }
        }
    }
}

function resolveCollission(collisionResult: [Collision, Component, Component], shipA: SpaceShip, shipB: SpaceShip) {
    const [collision, aComp, bComp] = collisionResult;
    shipA.onCollision(collision, aComp);
    shipB.onCollision({
        ...collision,
        normal: {
            x: -collision.normal.x,
            y: -collision.normal.y
        },
    }, bComp);
    const normalNormalized = getNormalized(collision.normal);
    const moveAmount = {
        x: normalNormalized.x * 0.1 * UNIT_SCALE,
        y: normalNormalized.y * 0.1 * UNIT_SCALE
    }
    for(let i = 0; i < 30; i++){
        if(!shipA.collidesWith(shipB)) {console.log({i}); break};
        shipA.position = {
            x: shipA.position.x + moveAmount.x,
            y: shipA.position.y + moveAmount.y
        }
        shipB.position = {
            x: shipB.position.x - moveAmount.x,
            y: shipB.position.y - moveAmount.y
        }
    }
}

