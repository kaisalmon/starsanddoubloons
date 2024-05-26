import { Socket } from "socket.io";
import { createCombatAI } from "./AI/CombatAI";
import { NetworkAI, PLAYER_AI } from "./AI/PlayerAI";
import { Cannonball, CANNONBALL_AGE, CannonballDump } from "./Cannonball";
import Collision from "./Collision";
import Component, { UNIT_SCALE } from "./Component";
import { SpaceShip, SpaceshipDump } from "./SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "./SpaceshipIntent";
import { getNormalized } from "./Vector2";
type Unarray<T> = T extends Array<infer U> ? U : T;
type EventListeners = {
    "collision": ((args:[SpaceShip, SpaceShip, Collision])=>void)[]
    "cannonballFired": ((args:[SpaceShip|null, Cannonball, Component|null])=>void)[],
    "cannonballRemoved": ((args:[Cannonball])=>void)[],
    "componentDestroyed": ((args:[Component, SpaceShip])=>void)[],
}
type Events = keyof EventListeners;
type EventCallback<T extends Events> = Unarray<EventListeners[T]>
type EventParams<T extends Events> = Parameters<EventCallback<T>>[0]


export class GameLevel {
    player: SpaceShip;
    playerIntent: SpaceshipIntent = EMPTY_INTENT;
    ships: SpaceShip[];

    private listeners:EventListeners = {
        "collision": [],
        "cannonballFired": [],
        "cannonballRemoved": [],
        "componentDestroyed": []
    }
    readonly cannonballs: Cannonball[] = [];

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

    constructor(ships: SpaceShip[],  gameId:string, socket: Socket){
        this.ships = ships;
        this.ships.forEach(enemy => enemy.level = this);
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('playerId')
        const playerShip = this.ships.find(ship=>ship.id == id)
        if(!playerShip){
            throw new Error("Invalid playerId queryparam!")
        }
        this.player = playerShip
        this.ships.forEach(ship=>{
            ship.ai = ship === playerShip ? PLAYER_AI : new NetworkAI(ship.id, gameId, socket)
        })
    }
    
    update(delta: number): void {
        this.ships.forEach(enemy => enemy.update( delta));
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
        const ships:SpaceShip[] = this.ships
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
            this.triggerEvent('cannonballRemoved', [cannonball])
        }
    }

    getAllSpaceships(): SpaceShip[] {
       return this.ships
    }
    
    dump(): LevelDump {
       return {
        spaceship: this.player.dump(),
        cannonballs: this.cannonballs.filter(c=>c.firer===this.player.id).map(c=>c.dump())
       }
    }
    fromDump(dump: LevelDump) {
        this.ships.find(s=>s.id == dump.spaceship.id)!.fromDump(dump.spaceship)
        if(dump.cannonballs){
            [...this.cannonballs].forEach(c=>{
                if(c.firer === this.player.id) return
                if(dump.cannonballs!.some(cbDump=>cbDump.id === c.id)) return
                this.removeCannonball(c)
            })
            dump.cannonballs.forEach(cbDump=>{
                if(cbDump.firer === this.player.id) return
                const existantCb = this.cannonballs.find(cb=>cb.id === cbDump.id)
                if(existantCb){
                    existantCb.fromDump(cbDump)
                }else{
                    const newCannonball = new Cannonball(cbDump.position, cbDump.velocity, cbDump.firer, cbDump.id)
                    this.cannonballs.push(newCannonball);
                    this.triggerEvent('cannonballFired', [this.ships.find(s=>s.id==cbDump.firer)!, newCannonball, null]);
                }
            })
        }
       
  
    }
}

type LevelDump = {
    spaceship: SpaceshipDump,
    cannonballs?: CannonballDump[]
}