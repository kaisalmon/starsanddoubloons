import { GameLevel } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import { AI } from "./ai";

export type FiniteStateMachineConfig = Record<string, FiniteStateMachineConfigEntry>;
export type FiniteStateMachineConfigEntry = {
    ai: AI;
    getNextState: (ship: SpaceShip, level: GameLevel) => string|undefined;
};

export class FiniteStateMachineAI implements AI {
    private currentState: string;


    constructor(private states: FiniteStateMachineConfig, private initialState: string) {
        this.currentState = this.initialState;
    }

    getIntent(ship: SpaceShip, level: GameLevel): SpaceshipIntent {
        return this.states[this.currentState].ai.getIntent(ship, level);
    }

    update(delta: number, ship: SpaceShip, level: GameLevel): void {
        this.states[this.currentState].ai.update?.(delta, ship, level);
        const nextState = this.states[this.currentState].getNextState(ship, level);
        if (nextState !== undefined && nextState !== this.currentState) {
            console.log(`Switching from ${this.currentState} to ${nextState}`);
            this.states[this.currentState].ai.onDeactivated?.(ship, level);
            this.currentState = nextState;
            this.states[this.currentState].ai.onActivated?.(ship, level);
        }
    }
}