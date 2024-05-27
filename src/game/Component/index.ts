import { GAME_SPEED } from "../../scenes/SpaceScene";
import { Cannonball, CANNONBALL_KNOCKBACK, CANNONBALL_SPEED } from "../Cannonball";
import Collision, { BoundingBox, doRectanglesIntersect, MOMENTUM_TO_DAMAGE } from "../Collision";
import Force, { rotate, sum } from "../Force";
import { SpaceShip, Weapon } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import Vector2, { findShortestDistanceBetweenTwoMovingObjects, getLinearVelocityFromAngularVelocity, getMagnitude } from "../Vector2";
import ComponentType, { ComponentTypeDump, componentTypefromDump, dumpComponentType } from "./ComponentType";

const WEAPON_ANGLES = {
    right: Math.PI,
    left: 0
}
export const UNIT_SCALE = 1;
const INV_TIME = 30 

export default class Component {
    _type: ComponentType;
    position: Vector2; // Relative position of the component to the spaceship's top left corner
    isPowered = false;
    damage = 0;
    invTime: number|null = null;
    spaceship!: SpaceShip

    constructor(type: ComponentType, position: Vector2) {
        this._type = type;
        this.position = position;
    }

    get type(): ComponentType {
        const decorators = this.spaceship.components
            .filter(c=>!c.isDestroyed(false))
            .map(c=>c._type.decorateComponent!)
            .filter(d=>d!==undefined)
        let decorated = this._type;
        decorators.forEach(decorator => {
            decorated = decorator(decorated)
        })
        return decorated
    }

    set type(t: ComponentType) {
        this._type = t
    }

    get width(): number {
        return this.type.width;
    }
    get height(): number {
        return this.type.height;
    }
    get mass(): number {
        if(this.isDestroyed()){
            return this.type.mass/3;
        }
        return this.type.mass;
    }


    //Calculate the thrust of the component
    getThrust(intent: SpaceshipIntent, spaceship: SpaceShip): Force|undefined {
        if(this.isDestroyed()){
            return undefined;
        }
        this.isPowered = this.type.isPowered(intent, this, spaceship);
        const force = this.type.getThrust(this.isPowered, intent, this, spaceship);
        if(!force){
            return undefined;
        }
        if(force.offsetY !== 0 || force.offsetX !== 0){
            throw new Error("Thrust offset must not be 0, 0");
        }
        const rotatedForce = rotate(force, spaceship.angle);
        const CoM = this.getCenterOfMassInWorldSpace();
        return {
            x: rotatedForce.x,
            y: rotatedForce.y,
            offsetX: CoM.x - spaceship.position.x,
            offsetY: CoM.y - spaceship.position.y
        }
    }

    getCoMInUnitSpace(): Vector2 {
        return {x: this.position.x + this.width/2, y: this.position.y + this.height/2};
    }

    isAheadOfShipCoM(ship:SpaceShip): boolean {
        return this.getCoMInUnitSpace().y > ship.getCenterOfMassUnitSpace().y;
    }

    //Calculate the drag of the component, offset to this component's center x,y (not the x,y of the component)
    getDrag(spaceship: SpaceShip): Force {
        if(this.isDestroyed()){
            return {x: 0, y: 0, offsetX: 0, offsetY: 0};
        }
        const dragCoefficient: number = this.type.drag;
        const velocity = this.getEffectiveVelocity(spaceship);
        const {x: ox, y: oy} = this.getCenterOfMassInWorldSpace();
        const force: Force = {
            x: -velocity.x * dragCoefficient,
            y: -velocity.y * dragCoefficient,
            offsetX: ox - spaceship.position.x, 
            offsetY: oy - spaceship.position.y
        };
       
        return force;
    }

    getTotalForce(intent: SpaceshipIntent, spaceship: SpaceShip): Force {
        const thrust = this.getThrust(intent, spaceship);
        if(!thrust){
            return this.getDrag(spaceship);
        }
        return sum([this.getDrag(spaceship), thrust]);
    }

    // Get effective velcolity, taking into account the spaceship velocity and spaceship rotation
    getEffectiveVelocity(spaceship: SpaceShip):Vector2 {
        const baseVelocity: Vector2 = {x: spaceship.velocity.x, y: spaceship.velocity.y};
        const velocityFromRotation: Vector2 = this.getVelocityFromRotation(spaceship);
        return { 
            x: baseVelocity.x + velocityFromRotation.x,
            y: baseVelocity.y + velocityFromRotation.y
        }
    }

    // Given the spaceship, the position of the component, and the center of mass, calculate the amount the rotational velocity of the spaceship contributes to the 
    // components velocity
    // EXAMPLE
    // Component is at x: 3, y: 3
    // Center of mass is at x: 3, y: 0
    // Rotational velocity is 10
    // Then the relative position is (0, 3)
    // So the angle relative to the center of mass is 0
    // so the component velocity is (10 * 3, 0) or (30, 0)
    getVelocityFromRotation(spaceship: SpaceShip): Vector2 {
        const shipCoM = spaceship.getCenterOfMassWorldSpace();
        const componentCoM = this.getCenterOfMassInWorldSpace();
        const relativePosition = {
            x: componentCoM.x - shipCoM.x,
            y: componentCoM.y - shipCoM.y        };
        const radius = Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.y * relativePosition.y);
        const angle = Math.atan2(relativePosition.x, relativePosition.y);

        return getLinearVelocityFromAngularVelocity({
            angle,
            radius,
            angularVelocity: spaceship.angularVelocity
        })

    }

    getCenterOfMassInWorldSpace(): Vector2 {
        const spaceship = this.spaceship
        const centerOfMass = spaceship.getCenterOfMassUnitSpace();
        const x = this.position.x - centerOfMass.x + this.width/2;
        const y = this.position.y - centerOfMass.y + this.height/2;
        const rotatedX = x * Math.cos(spaceship.angle) - y * Math.sin(spaceship.angle);
        const rotatedY = x * Math.sin(spaceship.angle) + y * Math.cos(spaceship.angle);
        return {x: rotatedX * UNIT_SCALE + spaceship.position.x, y: rotatedY * UNIT_SCALE+ spaceship.position.y};
    }

    getKeneticEnergy(spaceship:SpaceShip): number {
        const vel = this.getEffectiveVelocity(spaceship);
        return 0.5 * this.mass * (vel.x * vel.x + vel.y * vel.y);
    }

    getBoundingBox(): BoundingBox {
        const unitSpaceHitbox = this.type.hitbox || {
            width: this.width,
            height: this.height,
            position: {x: 0, y: 0},
            angle: 0
        };
        const spaceship = this.spaceship
        const angle = spaceship.angle + unitSpaceHitbox.angle;
        const com = this.getCenterOfMassInWorldSpace();
        const position = {
            x: com.x + 
                (unitSpaceHitbox.position.x * Math.cos(spaceship.angle) 
                - unitSpaceHitbox.position.y * Math.sin(spaceship.angle))* UNIT_SCALE,

            y: com.y + 
            (unitSpaceHitbox.position.x * Math.sin(spaceship.angle) 
            + unitSpaceHitbox.position.y * Math.cos(spaceship.angle))* UNIT_SCALE,
        }
        const width = unitSpaceHitbox.width * UNIT_SCALE;
        const height = unitSpaceHitbox.height * UNIT_SCALE;
        return {
            position,
            angle,
            width,
            height
        }
    }


    fire(weapon: Weapon, spaceship: SpaceShip): void {
        if(this.isDestroyed()){
            return;
        }
        if(this.type.weaponType !== weapon){
            return
        }
        let shots = this.type.shots;
        for(let i=0; i<shots;i++){
            const delay = this.type.fireDelay(i);
            setTimeout(()=>{
                const {x,y} = this.getCenterOfMassInWorldSpace();
                //const o:Vector2 = i==0 ? {x:0,y:0} : {x:(Math.random()-.5)*UNIT_SCALE*2, y:(Math.random()-.5)*UNIT_SCALE*2}
                const cannonball = new Cannonball({
                    x, y
                }, this.getCannonballVelocity(spaceship, weapon),
                    spaceship.id,
                    this.type.bounces
                );
            spaceship.addCannonball(cannonball, this);
            if(i==0){
                spaceship.impulses.push({
                    x: -cannonball.velocity.x * CANNONBALL_KNOCKBACK,
                    y: -cannonball.velocity.y  * CANNONBALL_KNOCKBACK,
                    offsetX: cannonball.position.x - spaceship.position.x,
                    offsetY: cannonball.position.y - spaceship.position.y
                });
            }
            }, delay * GAME_SPEED)
        }
    }


    private getCannonballVelocity(spaceship:SpaceShip, weapon:Weapon): Vector2 {
        const angle = spaceship.angle + WEAPON_ANGLES[weapon] + (Math.random()-.5) * this.type.inaccuracy;
        return {
            x: spaceship.velocity.x + Math.cos(angle) * CANNONBALL_SPEED,
            y: spaceship.velocity.y + Math.sin(angle) * CANNONBALL_SPEED
        };
    }

    onHit(cannonball: Cannonball, spaceship: SpaceShip): void {
        if(this.invTime && this.invTime>0) return
        this.dealDamage(cannonball.getDamage());
    }

    collidesWith(spaceship:SpaceShip, other: SpaceShip): [Collision, Component, Component] | undefined {
        const box = this.getBoundingBox();

        if(!this.isCollidable()) return undefined;

        for(const otherComponent of other.components){
            const otherBox = otherComponent.getBoundingBox();
            if(!otherComponent.isCollidable()) continue;
            const intersection = doRectanglesIntersect(box, otherBox);
            if(!intersection){
                continue;
            }
            const relativeVelocity = {
                x: this.getEffectiveVelocity(spaceship).x - otherComponent.getEffectiveVelocity(other).x,
                y: this.getEffectiveVelocity(spaceship).y - otherComponent.getEffectiveVelocity(other).y
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
                momentum: speed * (this.mass + other.mass)
            }
            return [collission, this, otherComponent];
        }
    }

    onCollision(collision: Collision): void {
        if(collision.momentum > MOMENTUM_TO_DAMAGE && this.invTime!==null){
            this.dealDamage(1);
        }
    }
     
    dealDamage(damage: number) {
        this.invTime = INV_TIME
        const wasDestroyed = this.isDestroyed();
        const spaceshipWasDestroyed = this.spaceship.isDestroyed();
        this.damage += damage;
        this.damage = Math.min(this.damage, this.type.health);
        if(this.isDestroyed() && !wasDestroyed){
            const spaceshipDestroyed = this.spaceship.isDestroyed();
            if(spaceshipDestroyed && !spaceshipWasDestroyed){
                this.spaceship.onDestroyed();
            }
        }
    }
    
    onDestroyed(spaceship: SpaceShip): void {
        this.isPowered = false;

        const CoM = spaceship.getCenterOfMassInRotatedShipSpace();
        const newCoM = spaceship.getCenterOfMassInRotatedShipSpace();
        const offset = {
            x: CoM.x - newCoM.x,
            y: CoM.y - newCoM.y
        }
        spaceship.position = {
            x: spaceship.position.x - offset.x,
            y: spaceship.position.y - offset.y
        }
        spaceship.onComponentDestroyed(this);
    }

    isDestroyed(recursive=true): boolean {
        if(recursive) return this.damage >= this.type.health;
        return this.damage >= this._type.health;
    }    
    isCollidable(): boolean {
        return !this.isDestroyed();
    }

    isAimingAt(target: SpaceShip, spaceship: SpaceShip): boolean {
        if(this.isDestroyed() || target.isDestroyed()){
            return false;
        }
        if(this.type.weaponType === undefined){
            return false;
        }
        const cannonballPosition = this.getCenterOfMassInWorldSpace();
        const cannonballVelocity = this.getCannonballVelocity(spaceship, this.type.weaponType);
        const targetPosition = target.position
        const targetVelocity = target.velocity
        const shortestDistance = findShortestDistanceBetweenTwoMovingObjects(cannonballPosition, cannonballVelocity, targetPosition, targetVelocity);
        if(shortestDistance === null){
            return false
        }
        return shortestDistance <= target.radius/6
    }

    update( delta: number){
        if(this.invTime){
            this.invTime -= delta
            if(this.invTime <= 0){
                this.invTime = null
            }
        }
    }
    
    dump(full=false): ComponentDump|ComponentDumpFull {
        const baseDump = {
            damage: this.damage,
            invTime: this.invTime
        }
        if(full){
            return {
                ...baseDump,
                position: this.position,
                type: dumpComponentType(this.type)
            }
        }
        return baseDump
    }
    
    applyDump(dump: ComponentDump): void {
       this.damage = dump.damage
       this.invTime = dump.invTime
    }

    static fromDump(dump: ComponentDumpFull, spaceship: SpaceShip): Component{
        const comp= new Component(componentTypefromDump(dump.type), dump.position)
        comp.spaceship = spaceship
        return comp
    }
}

export interface ComponentDump {
    damage: number
    invTime: number|null
}

export interface ComponentDumpFull extends ComponentDump {
    type: ComponentTypeDump;
    position: Vector2;
}