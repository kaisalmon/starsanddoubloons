import { Level } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../SpaceshipIntent";

export interface AI {
    getIntent(ship:SpaceShip, level:Level): SpaceshipIntent;
}

export const IDLE_AI:AI = {
    getIntent(): SpaceshipIntent {
        return EMPTY_INTENT
    }
}