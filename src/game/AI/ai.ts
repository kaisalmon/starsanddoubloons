import {GameLevel} from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../SpaceshipIntent";

export interface AI {
    getIntent(ship:SpaceShip, level:GameLevel): SpaceshipIntent;
}

export function constantAI(intent:SpaceshipIntent):AI{
    return {
        getIntent():SpaceshipIntent{
            return intent;
        }
    }
}

export const IDLE_AI:AI = constantAI(EMPTY_INTENT);
