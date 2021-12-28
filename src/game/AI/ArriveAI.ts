import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import Vector2, { getDistance } from "../Vector2";
import { AI } from "./ai";
import { ChaserAI } from "./ChaserAI";


export class ArriveAI implements AI{
    private base:ChaserAI;
    constructor(getTarget:(level: GameLevel)=>Vector2, private slowDistance:number){
        this.base = new ChaserAI(getTarget);
    }
    getIntent(ship: SpaceShip, level:GameLevel): SpaceshipIntent {
        const baseIntent = this.base.getIntent(ship, level);
        const target = this.base.getTarget(level);
        const pos = ship.position;
        const distance = getDistance(pos, target);
        if(distance > this.slowDistance || baseIntent.moveForward === false) {
            return baseIntent;
        }
        const forwardProb = Math.pow(distance / this.slowDistance, 2);
        const moveForward = Math.random() < forwardProb;
        return {
            ...baseIntent,
            moveForward
        }
    }
}