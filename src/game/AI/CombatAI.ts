import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import Vector2, { getDistance, getMagnitude } from "../Vector2";
import { AI, IDLE_AI } from "./ai";
import { AlignAI } from "./AlignAI";
import { ChaserAI } from "./ChaserAI";
import ConditionalAI from "./ConditionalAI";
import { FIRE_AI } from "./FireAI";
import { FiniteStateMachineAI } from "./FSMAI";

const CHASE_DISTANCE = 20;
const FIRE_DISTANCE = 15;

function getPlayerVector(level:GameLevel): Vector2 {
    return level.player.position
}

export function createCombatAI():AI{
    const chase = new ChaserAI(getPlayerVector);
    const orbit = FIRE_AI;
    const flee = new AlignAI(getPlayerVector, Math.PI);

    return new FiniteStateMachineAI({
        "chase": {
            ai: chase,
            getNextState(ship:SpaceShip, level:GameLevel): string {
                const distance = getDistance(ship.position, level.player.position);
                if(distance < FIRE_DISTANCE){
                    return "fire";
                }
                return "chase";
            }
        },
        "fire": {
            ai: orbit,
            getNextState(ship:SpaceShip, level:GameLevel): string {
                const distance = getDistance(ship.position, level.player.position);
                if(distance > CHASE_DISTANCE){
                    return "chase";
                }
                if(ship.weaponCalldown !== undefined){
                    return "flee"
                }
                return "fire";
            }
        },
        "flee": {
            ai: flee,
            getNextState(ship:SpaceShip, level:GameLevel): string {
                if(ship.weaponCalldown === undefined){
                    return "chase";
                }
                return "flee";
            }
        }
    }, "chase")
}