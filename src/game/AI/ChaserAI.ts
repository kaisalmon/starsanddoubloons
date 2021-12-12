import { Level } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../SpaceshipIntent";
import Vector2, { normalizeAngle } from "../Vector2";
import { AI } from "./ai";


export class ChaserAI implements AI{
    getTarget:(level)=>Vector2;
    constructor( getTarget:(level)=>Vector2, private angleOffset: number = 0) {
        this.getTarget = getTarget;
    }
    getIntent(ship: SpaceShip, level:Level): SpaceshipIntent {
        const target = this.getTarget(level);
        const pos = ship.position;
        const shipAngle = normalizeAngle(ship.angle)
        const targetAngle = normalizeAngle(Math.atan2(target.y - pos.y, target.x - pos.x) - Math.PI/2 + this.angleOffset);
        const delta = normalizeAngle(shipAngle - targetAngle);
        const moveForward = Math.abs(delta) < Math.PI/5;
        if(Math.abs(delta) < 0.3) {
            return {
                ...EMPTY_INTENT,
                moveForward
            }
        }
        if(delta < Math.PI) {
            return {
                ...EMPTY_INTENT,
                rotateLeft: true,
                moveForward
            }
        }else{
            return {
                ...EMPTY_INTENT,
                rotateRight: true,
                moveForward
            }
        }
        
    }
}