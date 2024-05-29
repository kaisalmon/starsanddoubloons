import { SpaceShip } from "./SpaceShip";
import Vector2, { lerp } from "./Vector2";

export const CANNONBALL_AGE = 50;
export const CANNONBALL_FRIENDLY_FIRE_TIME = 5;
export const CANNONBALL_SPEED = 3.5;
export const CANNONBALL_KNOCKBACK = 3;

export class Cannonball {
    position: Vector2;
    velocity: Vector2;
    firer: string;
    id: string;
    bounces = 0;
    age = 0;
    maxAge: number;
    friction: number;
    radius = 1;

    get angle(): number {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }
    constructor(position: Vector2, velocity: Vector2, firer: string, bounces: number, maxAge:number, friction:number,  id?:string) {
        this.position = position;
        this.velocity = velocity;
        this.firer = firer;
        this.bounces = bounces
        this.maxAge = maxAge
        this.friction = friction
        this.id = id ?? Math.floor(Math.random()*10000).toString()
    }

    getDamage(): number {
       return 1
    }

    update(dt: number) {
        this.age += dt;
        this.position.x += this.velocity.x * dt
        this.position.y += this.velocity.y * dt
        this.velocity.x -=  this.velocity.x * this.friction * dt
        this.velocity.y -=  this.velocity.y * this.friction * dt
    }
    
    dump(): CannonballDump {
        return {
            position: this.position,
            velocity: this.velocity,
            firer: this.firer,
            age: this.age,
            id: this.id,
            bounces: this.bounces,
            maxAge: this.maxAge,
            friction: this.friction
        }
    } 

    applyDump(dump: CannonballDump, p=1){
        if(this.id !== dump.id) throw new Error("Cannonball id mismatch")
        this.position={
            x: lerp(this.position.x, dump.position.x, p),
            y: lerp(this.position.y, dump.position.y, p)
        }  
        this.velocity = dump.velocity
        this.firer = dump.firer
        this.age = dump.age
        this.bounces = dump.bounces
        this.maxAge = dump.maxAge
        this.friction= dump.friction
    }
}

export interface CannonballDump{
    maxAge: number;
    position: Vector2;
    velocity: Vector2;
    firer: string;
    age: number;
    id: string;
    bounces: number
    friction: number
}