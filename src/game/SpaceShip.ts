import { AI, IDLE_AI } from "./AI/ai";
import { Cannonball, CANNONBALL_FRIENDLY_FIRE_TIME, CANNONBALL_KNOCKBACK } from "./Cannonball";
import Collision, { BoundingBox, doPolygonsIntersect, doRectanglesIntersect, Line, rectangleToPolygon } from "./Collision";
import Component, { UNIT_SCALE } from "./Component";
import Force, { calculateTorques, sum } from "./Force";
import {GameLevel } from "./Level";
import SpaceshipIntent from "./SpaceshipIntent";
import Vector2, { getDistance, getMagnitude } from "./Vector2";

export type Weapon = 'left' | 'right';

const ROTATION_FACTOR = 0.2;
const COLLISION_KNOCKBACK = 0.01;

export class SpaceShip {
    components: Component[];
    ai: AI;
    level!:GameLevel;
    
    position: Vector2;
    velocity: Vector2; //Absolute velocity
    angle: number;
    angularVelocity: number;

    weaponCalldowns: Record<Weapon, undefined|number> = {
        'left': undefined,
        'right': undefined
    }

    impulses: Force[] = [];

    get mass(): number {
        return this.components.reduce((acc, component) => acc + component.mass, 0);
    }

    get keneticEnergy(): number {
        return this.components.reduce((acc, component) =>
            acc + component.getKeneticEnergy(this), 0);
    }

    get intent(): SpaceshipIntent {
        return this.ai.getIntent(this, this.level);
    }

    get boundingBox(): BoundingBox {
        const components = this.components
            .filter(component => component.isDestroyed() === false);
        const lowestX = components.reduce((acc, component) => Math.min(acc, component.position.x), Number.MAX_VALUE);
        const highestX = components.reduce((acc, component) => Math.max(acc, component.position.x + component.width), Number.MIN_VALUE);
        const lowestY = components.reduce((acc, component) => Math.min(acc, component.position.y), Number.MAX_VALUE);
        const highestY = components.reduce((acc, component) => Math.max(acc, component.position.y + component.height), Number.MIN_VALUE);
        const width = (highestX - lowestX) * UNIT_SCALE;
        const height = (highestY - lowestY) * UNIT_SCALE;
        return {
            position: this.position,
            angle: this.angle,
            width,
            height
        }
    }

    get radius():number {
        const box = this.boundingBox;
        return Math.sqrt(box.width/2 * box.width/2 + box.height/2 * box.height/2) * UNIT_SCALE;
    }

    get calldownTime():number {
        return 2;
    }

    constructor(components: Component[], ai: AI = IDLE_AI) {
        this.ai = ai;
        this.components = components;
        this.velocity = {x: 0, y: 0};
        this.angle = 0;
        this.angularVelocity = 0;
        this.position = {x: 0, y: 0};
    }

    // Return center of mass, measured in component units (not worldspace)
    getCenterOfMassUnitSpace(): Vector2 {
        let centerOfMass: Vector2 = {x: 0, y: 0};
        for(let component of this.components){
            centerOfMass.x += (component.position.x + component.width / 2) * component.mass;
            centerOfMass.y += (component.position.y + component.height / 2) * component.mass;
        }
        centerOfMass.x /= this.mass;
        centerOfMass.y /= this.mass;
        return centerOfMass;
    }

    getCenterOfMassInRotatedShipSpace(): Vector2 {
        const centerOfMass: Vector2 = this.getCenterOfMassUnitSpace();
        const angle = this.angle;
        return {
            x: centerOfMass.x * Math.cos(angle) * UNIT_SCALE - centerOfMass.y * Math.sin(angle) * UNIT_SCALE,
            y: centerOfMass.x * Math.sin(angle) * UNIT_SCALE + centerOfMass.y * Math.cos(angle) * UNIT_SCALE
        };
    }

    getCenterOfMassWorldSpace(): Vector2 {
        return {
            x: this.position.x,
            y: this.position.y
        };
    }

    getAllForces(delta: number): Force[] {
        const componentForces =  this.components
            .map(component => component.getTotalForce(this.intent, this))
            .map(force => ({
                x: force.x * delta,
                y: force.y * delta,
                offsetX: force.offsetX,
                offsetY: force.offsetY   
            }))
        const forces = ([] as Force[]).concat(componentForces, this.impulses);
        return forces;
    }

    getTorque(delta:number): number {
        const forces: Force[] = this.getAllForces(delta);
        return calculateTorques(forces);
    }

    update( delta: number): void {
        this.updateWeapons(delta);

        const forces: Force[] = this.getAllForces(delta);
        const torque: number = this.getTorque(delta);
        this.impulses = [];

        const totalForce: Vector2 = sum(forces);
        this.velocity.x += totalForce.x / this.mass;
        this.velocity.y += totalForce.y / this.mass;
        this.angularVelocity += torque / this.mass;
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;

        this.angle -= this.angularVelocity * delta * ROTATION_FACTOR;


    }


    private updateWeapons(delta: number) {
        for (let _key in this.weaponCalldowns) {
            const key = _key as Weapon;
            if (this.weaponCalldowns[key] !== undefined) {
                this.weaponCalldowns[key]! -= delta;
                if (this.weaponCalldowns[key]! <= 0) {
                    this.weaponCalldowns[key] = undefined;
                }
            }
        }
        if (this.intent.fireLeft) {
            this.attemptToFire('left');
        }
        if (this.intent.fireRight) {
            this.attemptToFire('right');
        }
    }

    collidesWith(other: SpaceShip):[Collision, Component, Component]|undefined {
        const boundingBox = this.boundingBox;
        const otherBoundingBox = other.boundingBox;
        if(!doRectanglesIntersect(boundingBox, otherBoundingBox)){
            return undefined;
        }
        for(let component of this.components){
            const box = component.getBoundingBox(this);
            if(!component.isCollidable()) continue;
            for(let otherComponent of other.components){
                const otherBox = otherComponent.getBoundingBox(other);
                if(!otherComponent.isCollidable()) continue;
                const intersection = doRectanglesIntersect(box, otherBox);
                if(intersection){
                    const relativeVelocity = {
                        x: component.getEffectiveVelocity(this).x - otherComponent.getEffectiveVelocity(other).x,
                        y: component.getEffectiveVelocity(this).y - otherComponent.getEffectiveVelocity(other).y
                    }
                    const speed = getMagnitude(relativeVelocity);
                    const collission:Collision = {
                        position: {
                            x: (box.position.x + other.position.x) / 2,
                            y: (box.position.y + other.position.y) / 2
                        },
                        normal: {
                            x: (box.position.x - other.position.x),
                            y: (box.position.y - other.position.y)
                        },
                        momentum: speed * (this.mass * other.mass) /2 
                    }
                    return [collission, component, otherComponent];
                }
            }
        }
    } 

    onCollision(collision: Collision, component: Component): void {
        this.impulses.push({
            x: collision.normal.x * collision.momentum * COLLISION_KNOCKBACK,
            y: collision.normal.y * collision.momentum * COLLISION_KNOCKBACK,
            offsetX: collision.position.x - this.position.x,
            offsetY: collision.position.y - this.position.y
        });
    }

    attemptToFire(weapon: Weapon) {
        if(this.weaponCalldowns[weapon] === undefined){
            this.weaponCalldowns[weapon] = this.calldownTime;
            this.fire(weapon);
        }
    }

    fire(weapon: Weapon) {
        this.components.forEach(component => {
            component.fire(weapon, this);
        });
    }

    addCannonball(cannonball: Cannonball) {
        this.level.addCannonball(cannonball, this)
    }

    checkCannonballColission(cannonball: Cannonball) {
        if(cannonball.firer === this && cannonball.age < CANNONBALL_FRIENDLY_FIRE_TIME){
            return;
        }
        const distance = getDistance(this.position, cannonball.position);
        if(distance > this.radius){
            return;
        }
        const cannonBallLine: Line = [
            {x: cannonball.position.x - cannonball.velocity.x, y: cannonball.position.y - cannonball.velocity.y},
            {x: cannonball.position.x, y: cannonball.position.y},
        ]
        const components = this.components
            .filter(component => component.isCollidable())
            .filter(component => doPolygonsIntersect(rectangleToPolygon(component.getBoundingBox(this)), cannonBallLine));
        if(components.length === 0){
            return;
        }
        components.sort((a, b) => {
            const cannonballPrevPosition = cannonBallLine[0];
            const aDistance = getDistance(a.getCenterOfMassInWorldSpace(this), cannonballPrevPosition);
            const bDistance = getDistance(b.getCenterOfMassInWorldSpace(this), cannonballPrevPosition);
            return aDistance - bDistance;
        });

        components[0].onHit(cannonball, this);

        this.impulses.push({
            x: cannonball.velocity.x * CANNONBALL_KNOCKBACK,
            y: cannonball.velocity.y  * CANNONBALL_KNOCKBACK,
            offsetX: cannonball.position.x - this.position.x,
            offsetY: cannonball.position.y - this.position.y
        });


        this.level.removeCannonball(cannonball);
    }

    onComponentDestroyed(component: Component) {
        this.level.triggerEvent('componentDestroyed', [component, this]);
    }
}
