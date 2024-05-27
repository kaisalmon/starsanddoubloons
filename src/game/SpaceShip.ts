import { AI, IDLE_AI } from "./AI/ai";
import { Cannonball, CANNONBALL_FRIENDLY_FIRE_TIME, CANNONBALL_KNOCKBACK } from "./Cannonball";
import Collision, { BoundingBox, doPolygonsIntersect, doRectanglesIntersect, rectangleToPolygon } from "./Collision";
import { Line } from "./Polygon";
import Component, { ComponentDump, ComponentDumpFull, UNIT_SCALE } from "./Component";
import ComponentType, { ComponentTypeDump, componentTypefromDump, dumpComponentType } from "./Component/ComponentType";
import Force, { calculateTorques, sum } from "./Force";
import {GameLevel } from "./Level";
import SpaceshipIntent from "./SpaceshipIntent";
import Vector2, { getDistance } from "./Vector2";

export type Weapon = 'left' | 'right';

const ROTATION_FACTOR = 0.2;
const COLLISION_KNOCKBACK = 0.01;
const MASS_MULTIPLIER = 1.5;
const SPEED_MULTIPLIER = 0.7;

export class SpaceShip {
    components: Component[];
    ai: AI;
    level!:GameLevel;
    
    position: Vector2;
    velocity: Vector2; //Absolute velocity
    angle: number;
    angularVelocity: number;
    id: string;
    weaponCalldown: undefined|number;

    impulses: Force[] = [];
    shelf: {typeName:string, count:number}[] = []
  
    get mass(): number {
        return this.components.reduce((acc, component) => acc + component.mass, 0) * MASS_MULTIPLIER;
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
        return 15;
    }

    constructor(id:string, components: Component[], ai: AI = IDLE_AI) {
        this.ai = ai;
        this.id = id
        this.components = components;
        this.components.forEach(c=>c.spaceship = this)
        this.velocity = {x: 0, y: 0};
        this.angle = 0;
        this.angularVelocity = 0;
        this.position = {x: 0, y: 0};
    }

    // Return center of mass, measured in component units (not worldspace)
    getCenterOfMassUnitSpace(): Vector2 {
        const centerOfMass: Vector2 = {x: 0, y: 0};
        for(const component of this.components){
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
        this.ai.update?.(delta, this, this.level);
        this.updateWeapons(delta);
        this.components.forEach(c=>c.update(delta))

        const forces: Force[] = this.getAllForces(delta);
        const torque: number = this.getTorque(delta);
        this.impulses = [];

        const totalForce: Vector2 = sum(forces);
        this.velocity.x += totalForce.x / this.mass;
        this.velocity.y += totalForce.y / this.mass;
        this.angularVelocity += torque / this.mass;
        this.position.x += this.velocity.x * delta * SPEED_MULTIPLIER;
        this.position.y += this.velocity.y * delta * SPEED_MULTIPLIER;

        this.angle -= this.angularVelocity * delta * ROTATION_FACTOR;


    }


    private updateWeapons(delta: number) {
        if (this.weaponCalldown !== undefined) {
            this.weaponCalldown -= delta;
            if (this.weaponCalldown <= 0) {
                this.weaponCalldown = undefined;
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
        for(const component of this.components){
            const result = component.collidesWith(this, other);
            if(result !== undefined){
                return result;
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
        component.onCollision(collision);
    }

    attemptToFire(weapon: Weapon) {
        if(this.weaponCalldown=== undefined){
            this.weaponCalldown = this.calldownTime;
            this.fire(weapon);
        }
    }

    fire(weapon: Weapon) {
        this.components.forEach(component => {
            component.fire(weapon, this);
        });
    }

    addCannonball(cannonball: Cannonball, component: Component) {
        this.level.addCannonball(cannonball, this, component);
    }

    checkCannonballColission(cannonball: Cannonball) {
        if(cannonball.firer === this.id && cannonball.age < CANNONBALL_FRIENDLY_FIRE_TIME){
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
            .filter(component => doPolygonsIntersect(rectangleToPolygon(component.getBoundingBox()), cannonBallLine));
        if(components.length === 0){
            return;
        }
        components.sort((a, b) => {
            const cannonballPrevPosition = cannonBallLine[0];
            const aDistance = getDistance(a.getCenterOfMassInWorldSpace(), cannonballPrevPosition);
            const bDistance = getDistance(b.getCenterOfMassInWorldSpace(), cannonballPrevPosition);
            return aDistance - bDistance;
        });

        if(!this.isInvincible()){
            components[0].onHit(cannonball, this);
        }

        this.impulses.push({
            x: cannonball.velocity.x * CANNONBALL_KNOCKBACK,
            y: cannonball.velocity.y  * CANNONBALL_KNOCKBACK,
            offsetX: cannonball.position.x - this.position.x,
            offsetY: cannonball.position.y - this.position.y
        });


        this.level.removeCannonball(cannonball);
    }
    isInvincible(): boolean {
        return false;
    }

    onComponentDestroyed(component: Component) {
        this.level.triggerEvent('componentDestroyed', [component, this]);
    }


    hasWeapons(weapon: Weapon): boolean {
        return this.components.some(component => {
            return component.type.weaponType === weapon && !component.isDestroyed();
        })
    }

    isAimingAt(target: SpaceShip, weapon: Weapon): boolean {
        return this.components.some(component => {
            if(component.type.weaponType === weapon && !component.isDestroyed()){
                return component.isAimingAt(target, this);
            }
        });
    }

    isDestroyed(): boolean {
        const hasBridge = this.components.some(component => component.type.isBridge && !component.isDestroyed());
        const hasEngine = this.components.some(component => component.type.isEngine && !component.isDestroyed());
        return !hasBridge || !hasEngine;
    }

    onDestroyed() {
        this.components
            .filter(c=>!c.isDestroyed())
            .forEach(c=>c.dealDamage(100));
    }
    dump(): SpaceshipDump {
        return {
            position: this.position,
            velocity: this.velocity,
            angle: this.angle,
            angularVelocity: this.angularVelocity,
            id: this.id,
            weaponCalldown: this.weaponCalldown,
            components: this.components.map(c=>c.dump())
        }
    }
    fulldump(): SpaceshipDump {
        return {
            ...this.dump(),
            components: undefined,
            fullComponents: this.components.map(c=>c.dump(true) as ComponentDumpFull),
            shelf: this.shelf.map(c=>({
                typeName: c.typeName,
                count: c.count
            }))
        }
    }
    applyDump(dump:SpaceshipDump){
        this.position=dump.position  
        this.velocity=dump.velocity,
        this.angle=dump.angle,
        this.angularVelocity=dump.angularVelocity,
        this.id=dump.id,
        this.weaponCalldown=dump.weaponCalldown
        if(dump.fullComponents){
            this.components.splice(0, this.components.length)
            dump.fullComponents.forEach(cDump=>{
                this.components.push(Component.fromDump(cDump, this))
            })
            this.shelf.splice(0, this.shelf.length)
            dump.shelf!.forEach(sDump=>{
                this.shelf.push({
                    typeName: sDump.typeName,
                    count: sDump.count
                })
            })
        }else{
            dump.components!.forEach((cDump, i) => this.components[i].applyDump(cDump))
        }
    }

    
    resetHealth() {
        this.components.forEach(c=>c.resetHealth())
    }
}

export interface SpaceshipDump{
    position: Vector2;
    velocity: Vector2; //Absolute velocity
    angle: number;
    angularVelocity: number;
    id: string;
    weaponCalldown: undefined|number;
    components?: ComponentDump[]
    fullComponents?: ComponentDumpFull[]
    shelf?: {typeName:string, count:number}[]
}