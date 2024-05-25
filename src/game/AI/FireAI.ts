import { GameLevel } from "../Level";
import { SpaceShip, Weapon } from "../SpaceShip";
import { EMPTY_INTENT } from "../SpaceshipIntent";
import Vector2 from "../Vector2";
import { constantAI, IDLE_AI } from "./ai";
import { AlignAI } from "./AlignAI";
import ConditionalAI from "./ConditionalAI";

function getPlayerVector(level:GameLevel): Vector2 {
    return level.player.position
}
function isOnlyAimingAtPlayer(ship:SpaceShip, level:GameLevel, weapon:Weapon): boolean {
    const isAimingAt = ship.isAimingAt(level.player, weapon);
    if(!isAimingAt) {
        return false;
    }
    return level.ships.every(enemy => {
        return !ship.isAimingAt(enemy, weapon);
    })
}

export const FIRE_AI = new ConditionalAI([
    [constantAI({...EMPTY_INTENT, fireLeft: true}), (ship, level) => {
        return ship.weaponCalldown === undefined && ship.hasWeapons("left") && isOnlyAimingAtPlayer(ship, level, "left")
    }],
    [constantAI({...EMPTY_INTENT, fireRight: true}), (ship, level) => {
        return ship.weaponCalldown === undefined && ship.hasWeapons("right") &&  isOnlyAimingAtPlayer(ship, level, "right")
    }],
    [new AlignAI(getPlayerVector, Math.PI / 2), (ship) => {
        return ship.hasWeapons('left')
    }],
    [new AlignAI(getPlayerVector, 1.5 * Math.PI), (ship) => {
        return ship.hasWeapons('right')
    }]
], IDLE_AI);