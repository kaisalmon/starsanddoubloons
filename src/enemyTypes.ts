import { Enemy, GameState } from "./gameState";
import { Input } from "./updateMovement";

type EnemyType = {
    shootingPattern: {
        mod: number,
        shootOn: number[]
    }
    getInput: (e:Enemy, state:GameState)=>Input   
}

export default EnemyType;

export const NormalEnemy:EnemyType = {
    shootingPattern: {
        mod: 60,
        shootOn: [5, 8, 11],
    },
    getInput: (e:Enemy, state:GameState) => {
        const deltaX = e.pos.x - state.player.pos.x;
        const deltaY = e.pos.y - state.player.pos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        const phase = e.timer % 20 < 10;
        

        if(distance > (phase ? 300: 450)){
            return {
                x: -deltaX,
                y: -deltaY,
            }
        }else if(distance < (phase ? 200: 350)){
            return  {
                x: deltaX,
                y: deltaY,
            }
        }else if(phase){
            return  {
                x: deltaY,
                y: -deltaX,
            }
        }else{
            return  {
                x: -deltaY,
                y: deltaX,
            } 
        }
    }
}