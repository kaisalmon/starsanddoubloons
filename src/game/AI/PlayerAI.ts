import { Socket } from "socket.io";
import {GameLevel} from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../SpaceshipIntent";
import { AI } from "./ai";

export const PLAYER_AI:AI = {
    getIntent: function (ship: SpaceShip, level:GameLevel): SpaceshipIntent {
        if(level.player !== ship){
            throw new Error("Player AI is only for the player");
        }
        return level.playerIntent;
    }
}

export class NetworkAI implements AI{
    id: string;
    intent: SpaceshipIntent;
    constructor(id: string, gameId: string, socket: Socket){
        this.id = id
        this.intent = EMPTY_INTENT
        socket.on(`game ${gameId}`, (msg)=>{
            if(msg.player != this.id || !msg.intent) return
            this.intent = msg.intent
        })
    }
    getIntent(ship: SpaceShip, level: GameLevel): SpaceshipIntent {
        return this.intent
    }
}