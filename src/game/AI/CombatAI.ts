import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import Vector2, { getDistance, getMagnitude } from "../Vector2";
import { AI, IDLE_AI } from "./ai";
import { AlignAI } from "./AlignAI";
import { ArriveAI } from "./ArriveAI";
import { ChaserAI } from "./ChaserAI";
import { CollisionAvoidanceAI } from "./CollissionAvoidance";
import ConditionalAI from "./ConditionalAI";
import { FIRE_AI } from "./FireAI";
import FleeAI from "./FleeAI";
import { FiniteStateMachineAI } from "./FSMAI";

const CHASE_DISTANCE = 45;
const FIRE_DISTANCE = 40;

function getPlayerVector(level:GameLevel): Vector2 {
    return level.player.position
}

export function createCombatAI():AI{
    const chase = new ArriveAI(getPlayerVector, 60);
    const fireAi = FIRE_AI;
    const flee = new FleeAI(getPlayerVector);

    const fsm = new FiniteStateMachineAI({
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
            ai: fireAi,
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
                if(ship.weaponCalldown === undefined || ship.weaponCalldown < ship.calldownTime * 2 / 3){
                    return "chase";
                }
                return "flee";
            }
        }
    }, "chase")

    return new CollisionAvoidanceAI(fsm);
}