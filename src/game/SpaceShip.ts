import { AI, IDLE_AI } from "./AI/ai";
import { Cannonball, CANNONBALL_FRIENDLY_FIRE_TIME, CANNONBALL_KNOCKBACK } from "./Cannonball";
import Collision, { BoundingBox, doPolygonsIntersect, doRectanglesIntersect, doesLineIntersectCircle, rectangleToPolygon } from "./Collision";
import { Line } from "./Polygon";
import Component, { ComponentDump, ComponentDumpFull, UNIT_SCALE } from "./Component";
import Force, { calculateTorques, sum } from "./Force";
import {GameLevel } from "./Level";
import SpaceshipIntent from "./SpaceshipIntent";
import Vector2, { getDistance, lerp } from "./Vector2";

export type Weapon = 'left' | 'right' | 'back';

const ROTATION_FACTOR = 0.2;
const COLLISION_KNOCKBACK = 0.01;
const MASS_MULTIPLIER = 1.5;
const SPEED_MULTIPLIER = 0.7;
export const SHIELD_STAY_ACTIVE_TIME=3;
export const SHIELD_REACTIVATE_TIME=200;

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
    shieldsHitAt?: number;
  
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
        let lowestX = components.reduce((acc, component) => Math.min(acc, component.position.x), Number.MAX_VALUE);
        let highestX = components.reduce((acc, component) => Math.max(acc, component.position.x + component.width), Number.MIN_VALUE);
        let lowestY = components.reduce((acc, component) => Math.min(acc, component.position.y), Number.MAX_VALUE);
        let highestY = components.reduce((acc, component) => Math.max(acc, component.position.y + component.height), Number.MIN_VALUE);
        
        // Expand the bounding box to include the shields
        const shields = this.getShields();
       for (const shield of shields) {
           const shieldPosition = shield.getCoMInUnitSpace();
           const shieldRadius = shield.type.shieldRadius;
   
           const shieldLeft = shieldPosition.x - shieldRadius;
           const shieldRight = shieldPosition.x + shieldRadius;
           const shieldTop = shieldPosition.y - shieldRadius;
           const shieldBottom = shieldPosition.y + shieldRadius;
   
           // Calculate the lowest and highest x and y values including the shields
           lowestX = Math.min(lowestX, shieldLeft);
           highestX = Math.max(highestX, shieldRight);
           lowestY = Math.min(lowestY, shieldTop);
           highestY= Math.max(highestY, shieldBottom);
       }

        let width = (highestX - lowestX) * UNIT_SCALE;
        let height = (highestY - lowestY) * UNIT_SCALE;

        const centerX = (highestX+lowestX)/2
        const centerY = (highestY+lowestY)/2

        // Calculate the center of mass in unit space
        const centerOfMass = this.getCenterOfMassUnitSpace();

        // Calculate the offset between the center of mass and the center of the bounding box
        const offsetX = (centerX - centerOfMass.x) * UNIT_SCALE;
        const offsetY = (centerY - centerOfMass.y) * UNIT_SCALE;


        // Rotate the offset based on the spaceship's angle
        const rotatedOffsetX = offsetX * Math.cos(this.angle) - offsetY * Math.sin(this.angle);
        const rotatedOffsetY = offsetX * Math.sin(this.angle) + offsetY * Math.cos(this.angle);

       
        return {
            position:{
                x: this.position.x + rotatedOffsetX,
                y: this.position.y + rotatedOffsetY
            },
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
        this.updateDecoratedComponentTypes()
    }

    // Return center of mass, measured in component units (not worldspace)
    getCenterOfMassUnitSpace(): Vector2 {
        const centerOfMass: Vector2 = {x: 0, y: 0};
        for(const component of this.components){
            centerOfMass.x += (component.position.x + component.width / 2) * component.mass * MASS_MULTIPLIER;
            centerOfMass.y += (component.position.y + component.height / 2) * component.mass * MASS_MULTIPLIER;
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
        if (this.intent.fireBack) {
            this.attemptToFire('back');
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

    checkCannonballCollision(cannonball: Cannonball) {
        if (cannonball.firer === this.id && cannonball.age < CANNONBALL_FRIENDLY_FIRE_TIME) {
            return;
        }
    
        const distance = getDistance(this.position, cannonball.position);
        if (distance > this.radius + cannonball.radius) {
            return;
        }
    
        const cannonBallLine: Line = [
            { x: cannonball.position.x - cannonball.velocity.x, y: cannonball.position.y - cannonball.velocity.y },
            { x: cannonball.position.x, y: cannonball.position.y },
        ];

        // Check collision with shields
        const shields = this.getShields();
        for (const shield of shields) {
            const shieldPosition = shield.getCenterOfMassInWorldSpace();
            const shieldRadius = shield.type.shieldRadius;

            if (doesLineIntersectCircle(cannonBallLine, shieldPosition, shieldRadius)) {
                shield.onShieldHit();
                this.level.removeCannonball(cannonball);
                return;
            }
        }
    
        const components = this.components
            .filter(component => component.isCollidable())
            .filter(component => {
                if (cannonball.velocity.x < 1 && cannonball.velocity.y < 1) {
                    // For stationary cannonballs, check if the component's bounding box intersects with the cannonball's circular area
                    const boundingBox = component.getBoundingBox();
                    const centerX = cannonball.position.x;
                    const centerY = cannonball.position.y;
                    const radius = cannonball.radius;
    
                    const closestX = Math.max(boundingBox.position.x, Math.min(centerX, boundingBox.position.x + boundingBox.width));
                    const closestY = Math.max(boundingBox.position.y, Math.min(centerY, boundingBox.position.y + boundingBox.height));
    
                    const distanceSquared = Math.pow(closestX - centerX, 2) + Math.pow(closestY - centerY, 2);
                    return distanceSquared <= Math.pow(radius, 2);
                } else {
                    // For moving cannonballs, check if the component's bounding box intersects with the cannonball's trajectory line
                    return doPolygonsIntersect(rectangleToPolygon(component.getBoundingBox()), cannonBallLine);
                }
            });
    
        if (components.length === 0) {
            return;
        }
    
        components.sort((a, b) => {
            const cannonballPrevPosition = cannonBallLine[0];
            const aDistance = getDistance(a.getCenterOfMassInWorldSpace(), cannonballPrevPosition);
            const bDistance = getDistance(b.getCenterOfMassInWorldSpace(), cannonballPrevPosition);
            return aDistance - bDistance;
        });
    
        if (!this.isInvincible()) {
            components[0].onHit(cannonball, this);
        }
    
        this.impulses.push({
            x: cannonball.velocity.x * CANNONBALL_KNOCKBACK,
            y: cannonball.velocity.y * CANNONBALL_KNOCKBACK,
            offsetX: cannonball.position.x - this.position.x,
            offsetY: cannonball.position.y - this.position.y,
        });
    
        this.level.removeCannonball(cannonball);
    }
    isInvincible(): boolean {
        return false;
    }

    onComponentDestroyed(component: Component) {
        this.level.triggerEvent('componentDestroyed', [component, this]);
        this.updateDecoratedComponentTypes()
    }

    addComponent(component: Component){
        this.components.push(component)
        this.updateDecoratedComponentTypes()
    }
    removeComponent(component: Component){
        this.components.splice(this.components.indexOf(component), 1)
        this.updateDecoratedComponentTypes()
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
            components: this.components.map(c=>c.dump()),
            shieldsHitAt: this.shieldsHitAt
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
    applyDump(dump:SpaceshipDump, p=1){
        this.position={
            x: lerp(this.position.x, dump.position.x, p),
            y: lerp(this.position.y, dump.position.y, p)
        }  
        this.velocity=dump.velocity,
        this.angle=lerp(this.angle, dump.angle, p),
        this.angularVelocity=dump.angularVelocity,
        this.id=dump.id,
        this.weaponCalldown=dump.weaponCalldown
        this.shieldsHitAt=dump.shieldsHitAt
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
            this.updateDecoratedComponentTypes()
        }else{
            dump.components!.forEach((cDump, i) => this.components[i].applyDump(cDump))
        }
    }

    
    resetHealth() {
        this.components.forEach(c=>c.resetHealth())
    }

    updateDecoratedComponentTypes(){
        this.components.forEach(c=>c.updateDecoratedType())
    }

    areShieldsOnline(): boolean {
        const delta = this.timeSinceShieldsHit()
        if(delta){
            return delta <= SHIELD_STAY_ACTIVE_TIME || delta>=SHIELD_REACTIVATE_TIME
        }
        return true
    }

    timeSinceShieldsHit() {
        return this.shieldsHitAt && this.level.gametime - this.shieldsHitAt;
    }

    getShields(includeOffline=false): Component[] {
        return this.components.filter(c=>(c.isPowered||includeOffline) && c.type.shieldRadius > 0)
    }
    
    onShieldHit() {
        this.shieldsHitAt=this.level.gametime
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
    shieldsHitAt?: number;
}