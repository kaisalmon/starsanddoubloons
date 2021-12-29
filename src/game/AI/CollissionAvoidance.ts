import { doesLineIntersectCircle, doLinesIntersect, Line } from "../Collision";
import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import { AI } from "./ai";
import FleeAI from "./FleeAI";

const RAY_LENGTH = 15;

export class CollisionAvoidanceAI implements AI {

    wasRayHit = false;
    fleeAI?: FleeAI;

    constructor(private base: AI){}
    getIntent(ship: SpaceShip, level: GameLevel): SpaceshipIntent {
        const baseIntent = this.base.getIntent(ship, level);
    
        const ray = getSpaceshipRay(ship);
        const rayHit = level.getAllSpaceships().find(other => {
            if(other === ship) {
                return false;
            }
            const otherRay = getSpaceshipRay(other);
            return doLinesIntersect(ray, otherRay) || doesLineIntersectCircle(ray, other.position, other.radius);
        });
        this.wasRayHit = rayHit !== undefined;
        if(rayHit) {
            if(this.fleeAI === undefined) {
                this.fleeAI = new FleeAI(()=>rayHit.position);
            }
            return this.fleeAI.getIntent(ship, level);
        }else{
            this.fleeAI = undefined;
        }
        return baseIntent;
    }

    update(delta: number, ship: SpaceShip, level: GameLevel): void {
        this.base.update?.(delta, ship, level);
    }

    onActivated(ship: SpaceShip, level: GameLevel): void {
        this.base.onActivated?.(ship, level);
    }

    onDeactivated(ship: SpaceShip, level: GameLevel): void {
        this.base.onDeactivated?.(ship, level);
    }
}

export function getSpaceshipRay(ship: SpaceShip): Line{
    const ray:Line = [
        {x: ship.position.x, y: ship.position.y},
        {x: ship.position.x + ship.radius + ship.velocity.x * RAY_LENGTH, y: ship.position.y + ship.radius + ship.velocity.y * RAY_LENGTH}
    ]
    return ray;
}