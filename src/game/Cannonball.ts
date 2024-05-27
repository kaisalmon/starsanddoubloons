import { SpaceShip } from "./SpaceShip";
import Vector2 from "./Vector2";

export const CANNONBALL_AGE = 50;
export const CANNONBALL_FRIENDLY_FIRE_TIME = 5;
export const CANNONBALL_SPEED = 3.5;
export const CANNONBALL_KNOCKBACK = 3;

export class Cannonball {
    position: Vector2;
    velocity: Vector2;
    firer: string;
    id: string;
    bounces = 1;
    age = 0;

    get angle(): number {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }
    constructor(position: Vector2, velocity: Vector2, firer: string, id?:string) {
        this.position = position;
        this.velocity = velocity;
        this.firer = firer;
        this.id = id ?? Math.floor(Math.random()*10000).toString()
    }

    getDamage(): number {
       return 1
    }

    update(dt: number) {
        this.age += dt;
        this.position = {
            x: this.position.x + this.velocity.x * dt,
            y: this.position.y + this.velocity.y * dt
        }
    }
    
    dump(): CannonballDump {
        return {
            position: this.position,
            velocity: this.velocity,
            firer: this.firer,
            age: this.age,
            id: this.id,
            bounces: this.bounces
        }
    } 

    applyDump(dump: CannonballDump){
        if(this.id !== dump.id) throw new Error("Cannonball id mismatch")
        this.position = dump.position
        this.velocity = dump.velocity
        this.firer = dump.firer
        this.age = dump.age
        this.bounces = dump.bounces
    }
}

export interface CannonballDump{
    position: Vector2;
    velocity: Vector2;
    firer: string;
    age: number;
    id: string;
    bounces: number
}