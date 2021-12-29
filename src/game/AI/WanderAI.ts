import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import Vector2, { getDistance } from "../Vector2";
import { AI } from "./ai";
import { ArriveAI } from "./ArriveAI";

const WANDER_STEP_SIZE = 100;
const MIN_DISTANCE = 25;

export class WanderAI implements AI {
    target?: Vector2;
    base: ArriveAI;
    constructor(){
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.base = new ArriveAI(()=>this.target!, 30);
    }
    getIntent(ship: SpaceShip, level: GameLevel): SpaceshipIntent {
        if(this.target === undefined) {
            this.updateTarget(ship);
        }
        return this.base.getIntent(ship, level);
    }
    
    update(delta: number, ship: SpaceShip): void {
        if(this.target === undefined) {
            this.updateTarget(ship);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const distance = getDistance(ship.position, this.target!);
        if(distance < MIN_DISTANCE){
            this.updateTarget(ship);
        }
    }

    private updateTarget(ship: SpaceShip) {
        this.target = {
            x: ship.position.x + Math.random() * WANDER_STEP_SIZE - WANDER_STEP_SIZE / 2,
            y: ship.position.y + Math.random() * WANDER_STEP_SIZE - WANDER_STEP_SIZE / 2
        };
    }
}