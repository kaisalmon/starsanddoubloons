import { GameLevel } from "../Level";
import { EMPTY_INTENT } from "../SpaceshipIntent";
import Vector2 from "../Vector2";
import { constantAI, IDLE_AI } from "./ai";
import { AlignAI } from "./AlignAI";
import ConditionalAI from "./ConditionalAI";

function getPlayerVector(level:GameLevel): Vector2 {
    return level.player.position
}
export const FIRE_AI = new ConditionalAI([
    [constantAI({...EMPTY_INTENT, fireLeft: true}), (ship, level) => {
        return ship.weaponCalldown === undefined && ship.hasWeapons("left") && ship.isAimingAt(level.player.position, "left")
    }],
    [constantAI({...EMPTY_INTENT, fireRight: true}), (ship, level) => {
        return ship.weaponCalldown === undefined && ship.hasWeapons("left") && ship.isAimingAt(level.player.position, "right")
    }],
    [new AlignAI(getPlayerVector, Math.PI / 2), (ship, level) => {
        return ship.hasWeapons('left')
    }],
    [new AlignAI(getPlayerVector, +Math.PI / 2), (ship, level) => {
        return ship.hasWeapons('right')
    }]
], IDLE_AI);