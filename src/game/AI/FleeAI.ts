import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import Vector2, { normalizeAngle } from "../Vector2";
import { AI } from "./ai";
import { AlignAI } from "./AlignAI";

const FLEE_ARC = Math.PI/5;

export default class FleeAI implements AI{
    private base:AlignAI;
    constructor(private getPoint: (level:GameLevel)=>Vector2){
        this.base = new AlignAI(getPoint, Math.PI);
    }
    getIntent(ship: SpaceShip, level:GameLevel): SpaceshipIntent {
        const target = this.getPoint(level);
        const pos = ship.position;
        const baseIntent = this.base.getIntent(ship, level);
        const shipAngle = normalizeAngle(ship.angle)
        const angleToTarget = normalizeAngle(Math.atan2(target.y - pos.y, target.x - pos.x));
        const delta = normalizeAngle(shipAngle - angleToTarget);
        const moveForward = delta > normalizeAngle(Math.PI/2 - FLEE_ARC/2) && delta < normalizeAngle(Math.PI/2 + FLEE_ARC/2)
        return {
            ...baseIntent,
            moveForward
        }
    }
}