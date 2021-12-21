import { PLAYER_AI } from "./AI/PlayerAI";
import Collision from "./Collision";
import { SpaceShip } from "./SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "./SpaceshipIntent";
import { getNormalized } from "./Vector2";
import Component, { UNIT_SCALE } from "/Users/kaisalmon/Documents/Phaser/StarsAndDoubloons/src/game/Component/index";

type EventListeners = {
    "collision"?: ((args:[SpaceShip, SpaceShip, Collision])=>void)[]
}
type Events = keyof EventListeners;
type EventCallback<T extends Events> = EventListeners[T][0]
type EventParams<T extends Events> = Parameters<EventCallback<T>>[0]


export class GameLevel {
    player: SpaceShip;
    playerIntent: SpaceshipIntent = EMPTY_INTENT;
    enemies: SpaceShip[];

    private listeners:EventListeners = {}

    addEventListener<E extends Events>(event: E, callback: EventCallback<E>) {
        if(!this.listeners[event]){
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    removeEventListener<E extends Events>(event: E, callback: EventCallback<E>) {
        if(!this.listeners[event]){
            return;
        }
        this.listeners[event] = this.listeners[event].filter(e=>e!==callback);
    }
    triggerEvent<E extends Events>(event: E, param: EventParams<E>) {
        const listeners = this.listeners[event];
        if(!listeners){
            return;
        }
        listeners.forEach(e=>{
            e.call(null, param)
        });
    }

    constructor(player: SpaceShip, enemies: SpaceShip[]){
        this.enemies = enemies;
        this.player = player;
        this.enemies.forEach(enemy => enemy.level = this);
        this.player.level = this;
        this.player.ai = PLAYER_AI
    }
    
    update(delta: number): void {
        this.player.update(delta);
        this.enemies.forEach(enemy => enemy.update( delta));
        this.resolveCollisions();
    }

    resolveCollisions() {
        const ships:SpaceShip[] = [].concat(this.enemies, [this.player]);
        for (let i = 0; i < ships.length; i++) {
            for (let j = i + 1; j < ships.length; j++) {
                const collisionResult = ships[i].collidesWith(ships[j]);
                if (collisionResult) {
                    this.resolveCollission(collisionResult, ships[i],ships[j]);
                }
            }
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
            if(!shipA.collidesWith(shipB)) {break};
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

}
