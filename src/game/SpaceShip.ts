import { AI, IDLE_AI } from "./AI/ai";
import Collision, { BoundingBox, doRectanglesIntersect } from "./Collision";
import Component, { UNIT_SCALE } from "./Component";
import Force, { calculateTorques, sum } from "./Force";
import {GameLevel } from "./Level";
import SpaceshipIntent from "./SpaceshipIntent";
import Vector2, { getMagnitude } from "./Vector2";

const ROTATION_FACTOR = 0.2;
const COLLISION_KNOCKBACK = 0.3;

export class SpaceShip {
    components: Component[];
    ai: AI;
    level:GameLevel;
    
    position: Vector2;
    velocity: Vector2; //Absolute velocity
    angle: number;
    angularVelocity: number;

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
        const lowestX = this.components.reduce((acc, component) => Math.min(acc, component.position.x), Number.MAX_VALUE);
        const highestX = this.components.reduce((acc, component) => Math.max(acc, component.position.x + component.width), Number.MIN_VALUE);
        const lowestY = this.components.reduce((acc, component) => Math.min(acc, component.position.y), Number.MAX_VALUE);
        const highestY = this.components.reduce((acc, component) => Math.max(acc, component.position.y + component.height), Number.MIN_VALUE);
        const width = (highestX - lowestX) * UNIT_SCALE;
        const height = (highestY - lowestY) * UNIT_SCALE;
        return {
            position: this.position,
            angle: this.angle,
            width,
            height
        }
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

    getAllForces(): Force[] {
        const componentForces =  this.components.map(component => component.getTotalForce(this.intent, this));
        return [].concat(componentForces, this.impulses);
    }

    getTorque(): number {
        const forces: Force[] = this.getAllForces();
        return  calculateTorques(forces);
    }

    update( delta: number): void {
        const forces: Force[] = this.getAllForces();
        const torque: number = this.getTorque();
        const totalForce: Vector2 = sum(forces);
        this.velocity.x += totalForce.x / this.mass * delta;
        this.velocity.y += totalForce.y / this.mass * delta;
        this.angularVelocity += torque / this.mass * delta;
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;

        const angularVelocity = this.angularVelocity;
        this.angle -= angularVelocity * delta * ROTATION_FACTOR;

        this.impulses = [];
    }


    collidesWith(other: SpaceShip):[Collision, Component, Component]|undefined {
        const boundingBox = this.boundingBox;
        const otherBoundingBox = other.boundingBox;
        if(!doRectanglesIntersect(boundingBox, otherBoundingBox)){
            return undefined;
        }
        for(let component of this.components){
            for(let otherComponent of other.components){
                const box = component.getBoundingBox(this);
                const otherBox = otherComponent.getBoundingBox(other);
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
}
