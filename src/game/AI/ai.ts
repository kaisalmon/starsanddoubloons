import {GameLevel} from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../SpaceshipIntent";

export interface AI {
    getIntent(ship:SpaceShip, level:GameLevel): SpaceshipIntent;
    onActivated?(ship:SpaceShip, level:GameLevel): void;
    onDeactivated?(ship:SpaceShip, level:GameLevel): void;
    update?(delta: number, ship: SpaceShip, level: GameLevel): void;
}

export function constantAI(intent:SpaceshipIntent):AI{
    return {
        getIntent():SpaceshipIntent{
            return intent;
        }
    }
}

export const IDLE_AI:AI = constantAI({...EMPTY_INTENT});
