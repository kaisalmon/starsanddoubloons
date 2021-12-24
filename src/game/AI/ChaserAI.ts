import { UNIT_SCALE } from "../Component";
import {GameLevel} from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../SpaceshipIntent";
import Vector2, { getDistance, normalizeAngle } from "../Vector2";
import { AI } from "./ai";

const SLOW_ARC = Math.PI / 2;

export class ChaserAI implements AI{
    getTarget:(level: GameLevel)=>Vector2;
    constructor( getTarget:(level:GameLevel)=>Vector2) {
        this.getTarget = getTarget;
    }
    getIntent(ship: SpaceShip, level:GameLevel): SpaceshipIntent {
        const target = this.getTarget(level);
        const pos = ship.position;
        const shipAngle = normalizeAngle(ship.angle)
        const targetAngle = normalizeAngle(Math.atan2(target.y - pos.y, target.x - pos.x) - Math.PI/2 );
        const delta = normalizeAngle(shipAngle - targetAngle);

        const moveForward =  Math.abs(delta) < Math.PI/5;

        const rotateProbability = Math.abs(delta) > SLOW_ARC ? 1 : Math.abs(delta)/SLOW_ARC;
        const wouldRotate = Math.random() < rotateProbability;

        if(Math.abs(delta) < 0.05) {
            return {
                ...EMPTY_INTENT,
                moveForward
            }
        }
        if(delta < Math.PI) {
            return {
                ...EMPTY_INTENT,
                rotateLeft: wouldRotate,
                moveForward
            }
        }else{
            return {
                ...EMPTY_INTENT,
                rotateRight: wouldRotate,
                moveForward
            }
        }
        
    }
}