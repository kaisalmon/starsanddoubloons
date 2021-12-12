import { Level } from "../Level";
import Vector2, { getDistance, getMagnitude } from "../Vector2";
import { AI, IDLE_AI } from "./ai";
import { ChaserAI } from "./ChaserAI";
import ConditionalAI from "./ConditionalAI";

const CHASE_DISTANCE = 5;

function getPlayerVector(level:Level): Vector2 {
    return level.player.position
}

export function createCombatAI():AI{
    const chase = new ChaserAI(getPlayerVector);
    const orbit = new ChaserAI(getPlayerVector, Math.PI/2);
    const isFarFromPlayer = (ship, level)=>getDistance(ship.position, level.player.position) > CHASE_DISTANCE
    return chase;

    return new ConditionalAI([
        [chase, isFarFromPlayer],
    ],orbit)
}