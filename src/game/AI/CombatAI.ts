import { Level } from "../Level";
import Vector2, { getDistance, getMagnitude } from "../Vector2";
import { AI, IdleAI } from "./ai";
import { ChaserAI } from "./ChaserAI";
import ConditionalAI from "./ConditionalAI";

const CHASE_DISTANCE = 30;

function getPlayerVector(level:Level): Vector2 {
    return level.player.position
}

export function createCombatAI():AI{
    return new ConditionalAI([
        [new ChaserAI(getPlayerVector), (ship, level)=>getDistance(ship.position, level.player.position) < CHASE_DISTANCE],
    ],IdleAI)
}