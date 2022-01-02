import { SpaceShip } from "./SpaceShip";
import Vector2 from "./Vector2";

export const CANNONBALL_AGE = 50;
export const CANNONBALL_FRIENDLY_FIRE_TIME = 5;
export const CANNONBALL_SPEED = 2;
export const CANNONBALL_KNOCKBACK = 3;

export class Cannonball { 
    position: Vector2;
    velocity: Vector2;
    firer: SpaceShip;
    age = 0;
    damage = 1;

    get angle(): number {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }
    constructor(position: Vector2, velocity: Vector2, firer: SpaceShip) {
        this.position = position;
        this.velocity = velocity;
        this.firer = firer;
    }

    update(dt: number) {
        this.age += dt;
        this.position = {
            x: this.position.x + this.velocity.x * dt,
            y: this.position.y + this.velocity.y * dt
        }
    }
}