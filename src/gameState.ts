import EnemyType, {NormalEnemy} from "./enemyTypes";
import Graphic from "./graphic_coords";
import { Coord, Input, updatePhysics, updateVelocityFromInput } from "./updateMovement"

export type GameState = {
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
}

type Player = ObjectInfo;
export type Enemy = ObjectInfo & {type: EnemyType, timer: number};
type Bullet = ObjectInfo;

export type ObjectInfo = {
    key: string;
    pos: Coord;
    vel: Coord;
    accel?: number;
    friction?: number;
    graphic: Graphic;
}


export function stepGameState(state:GameState, delta:number, input:Input): void {
    updateVelocityFromInput(delta, state.player, input);
    for(let e of state.enemies) updateEnemy(delta, e, state);
    for(let o of getAllGameObjects(state)) updatePhysics(delta, o);
}

export function getAllGameObjects(state:GameState): ObjectInfo[] {
    return [state.player, ...state.enemies, ...state.bullets];
}

export function createEnemies(state:GameState){
    for(let i = 0; i < 10; i++){
        const x = Math.random() * 1000;
        const y = Math.random() * 1000;
        state.enemies.push({
            key: `e${Math.floor(Math.random()*1000000)}`,
            pos: {x, y},
            vel: {x: 0, y: 0},
            accel: 0.01,
            friction: 0.01,
            type: NormalEnemy,
            timer: Math.random()*100000,
            graphic: 'normal_enemy'
        });
    }
}

function updateEnemy(delta: number, e: Enemy, state:GameState) {
    e.timer += delta/100;

    const shootingPattern = e.type.shootingPattern;
    const shootingTimer = e.timer % shootingPattern.mod;
    if(shootingPattern.shootOn.some(n => shootingTimer > n && shootingTimer - delta/100 < n)){
        state.bullets.push({
            key: `b${Math.floor(Math.random()*1000000)}`,
            pos: {x: e.pos.x, y: e.pos.y},
            vel: {x: 1, y: 0},
            graphic: 'bullet'
        });
    }

    const repulsion = {x:0, y:0};

    for(let e2 of state.enemies){
        const REPULSION_FORCE = 0.5
        if(e === e2) continue;
        const deltaX = e.pos.x - e2.pos.x;
        const deltaY = e.pos.y - e2.pos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
       if(distance < 150){
            repulsion.x += deltaX * REPULSION_FORCE / (distance * distance);
            repulsion.y += deltaY * REPULSION_FORCE / (distance * distance);
       }
    }
    e.vel.x += repulsion.x * delta;
    e.vel.y += repulsion.y * delta;
    
    const input = e.type.getInput(e, state);
    updateVelocityFromInput(delta, e, input);

}
