import { PLAYER_AI } from "./AI/PlayerAI";
import { Cannonball, CANNONBALL_AGE } from "./Cannonball";
import Collision from "./Collision";
import { SpaceShip } from "./SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "./SpaceshipIntent";
import { getNormalized } from "./Vector2";
import Component, { UNIT_SCALE } from "/Users/kaisalmon/Documents/Phaser/StarsAndDoubloons/src/game/Component/index";
type Unarray<T> = T extends Array<infer U> ? U : T;
type EventListeners = {
    "collision": ((args:[SpaceShip, SpaceShip, Collision])=>void)[]
    "cannonballFired": ((args:[SpaceShip, Cannonball, Component])=>void)[],
    "cannonballRemoved": ((args:[Cannonball, number])=>void)[],
    "componentDestroyed": ((args:[Component, SpaceShip])=>void)[],
}
type Events = keyof EventListeners;
type EventCallback<T extends Events> = Unarray<EventListeners[T]>
type EventParams<T extends Events> = Parameters<EventCallback<T>>[0]


export class GameLevel {
    player: SpaceShip;
    playerIntent: SpaceshipIntent = EMPTY_INTENT;
    enemies: SpaceShip[];

    private listeners:EventListeners = {
        "collision": [],
        "cannonballFired": [],
        "cannonballRemoved": [],
        "componentDestroyed": []
    }
    cannonballs: Cannonball[] = [];

    addEventListener<E extends Events>(event: E, callback: EventCallback<E>) {
        if(!this.listeners[event]){
            this.listeners[event] = [];
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.listeners[event]?.push(callback as EventCallback<any>);
    }
    removeEventListener<E extends Events>(event: E, callback: EventCallback<E>) {
        if(!this.listeners[event]){
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.listeners[event] = (this.listeners[event] as EventCallback<E>[]).filter(e=>e!==callback) as EventCallback<any>
    }
    triggerEvent<E extends Events>(event: E, param: EventParams<E>) {
        const listeners = this.listeners[event];
        if(!listeners){
            return;
        }
        listeners.forEach(e=>{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e as any)(param)
        });
    }

    constructor(player: SpaceShip, enemies: SpaceShip[]){
        this.enemies = enemies;
        this.player = player;
        this.enemies.forEach(enemy => enemy.level = this);
        this.player.level = this;
        this.player.ai =  PLAYER_AI
    }
    
    update(delta: number): void {
        this.player.update(delta);
        this.enemies.forEach(enemy => enemy.update( delta));
        this.cannonballs.forEach(c => c.update( delta));
        let temp:Cannonball[] = [];
        temp = temp.concat(this.cannonballs);
        temp.forEach(c => {
            if(c.age > CANNONBALL_AGE){
                this.removeCannonball(c);
            }
        });
        this.resolveCollisions();
    }

    resolveCollisions() {
        const ships:SpaceShip[] = ([] as SpaceShip[]).concat(this.enemies, [this.player]);
        for (let i = 0; i < ships.length; i++) {
            for (let j = i + 1; j < ships.length; j++) {
                this.resolveCollisionsBetween(ships[i], ships[j]);
            }
            for (let j = 0; j < this.cannonballs.length; j++) {
                ships[i].checkCannonballColission(this.cannonballs[j]);
            }
        }
    }

    private resolveCollisionsBetween(a:SpaceShip, b:SpaceShip){
        const collisionResult = a.collidesWith(b);
        if (collisionResult) {
            this.resolveCollission(collisionResult, a, b);
        }
    }

    resolveCollission(collisionResult: [Collision, Component, Component], shipA: SpaceShip, shipB: SpaceShip) {
        const [collision, aComp, bComp] = collisionResult;
        shipA.onCollision(collision, aComp);
        shipB.onCollision({
            ...collision,
            normal: {
                x: -collision.normal.x,
                y: -collision.normal.y
            },
        }, bComp);
        const normalNormalized = getNormalized(collision.normal);
        const moveAmount = {
            x: normalNormalized.x * 0.1 * UNIT_SCALE,
            y: normalNormalized.y * 0.1 * UNIT_SCALE
        }
        for(let i = 0; i < 30; i++){
            if(!shipA.collidesWith(shipB)) {break}
            shipA.position = {
                x: shipA.position.x + moveAmount.x,
                y: shipA.position.y + moveAmount.y
            }
            shipB.position = {
                x: shipB.position.x - moveAmount.x,
                y: shipB.position.y - moveAmount.y
            }
        }
        this.triggerEvent('collision', [shipA, shipB, collision])
    }

    addCannonball(cannonball: Cannonball, spaceship:SpaceShip, component:Component) {
        this.cannonballs.push(cannonball)
        this.triggerEvent('cannonballFired', [spaceship, cannonball, component])
    }

    removeCannonball(cannonball: Cannonball) {
        const index = this.cannonballs.indexOf(cannonball);
        if(index !== -1){
            this.cannonballs.splice(index, 1);
            this.triggerEvent('cannonballRemoved', [cannonball, index])
        }
    }

    getAllSpaceships(): SpaceShip[] {
        return ([] as SpaceShip[]).concat(this.enemies, [this.player])
            .filter(ship => !ship.isDestroyed());
    }
}
