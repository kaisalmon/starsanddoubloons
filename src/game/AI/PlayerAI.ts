import {GameLevel} from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import { AI } from "./ai";

export const PLAYER_AI:AI = {
    getIntent: function (ship: SpaceShip, level:GameLevel): SpaceshipIntent {
        if(level.player !== ship){
            throw new Error("Player AI is only for the player");
        }
        return level.playerIntent;
    }
}