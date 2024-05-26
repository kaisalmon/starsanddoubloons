import { Cannonball } from "./Cannonball";
import Collision, { BoundingBox, Line, Polygon, doPolygonsIntersect, doRectanglesIntersect, rectangleToPolygon } from "./Collision";
import Component from "./Component";
import Force, { calculateTorques, sum } from "./Force";
import { GameLevel } from "./Level";
import { SpaceShip } from "./SpaceShip";
import Vector2, { getDistance } from "./Vector2";

const ROTATION_FACTOR = 0.2;
const SPEED_MULTIPLIER = 0.7;
const ANGULAR_FRICTION=0.1
const FRICTION=0.1
const COLLISION_KNOCKBACK = 0.01;
const CANNONBALL_KNOCKBACK = 20;

export default class Obstical {  
    position: Vector2;
    velocity: Vector2; //Absolute velocity
    angle: number;
    angularVelocity: number;
    impulses: Force[] = [];
    mass: number;

    shape: ObsticalShape
    level!: GameLevel;

    constructor(shape: ObsticalShape, position: Vector2, velocity: Vector2, angle: number, angularVelocity:number, mass: number){
        this.shape = shape
        this.position=position 
        this.velocity=velocity 
        this.angle=angle 
        this.angularVelocity=angularVelocity 
        this.mass=mass

    }

    update(delta: number){
        const forces: Force[] = this.impulses;
        const torque: number = calculateTorques(forces);
        this.impulses = [];
        const totalForce: Vector2 = sum(forces);
        this.velocity.x += totalForce.x / this.mass;
        this.velocity.y += totalForce.y / this.mass;
        this.angularVelocity += torque / this.mass;
        this.position.x += this.velocity.x * delta * SPEED_MULTIPLIER;
        this.position.y += this.velocity.y * delta * SPEED_MULTIPLIER;
        this.angle -= this.angularVelocity * delta * ROTATION_FACTOR;

        this.velocity.x -=  FRICTION *  this.velocity.x * delta
        this.velocity.y -= FRICTION *  this.velocity.y * delta
        this.angularVelocity -= ANGULAR_FRICTION *  this.angularVelocity * delta
    }
    
    collidesWith(other: SpaceShip): Component|undefined {
        const boundingBox = this.shape.getBoundingBox(this)
        const otherBoundingBox = other.boundingBox;
        if(!doRectanglesIntersect(boundingBox, otherBoundingBox)){
            return undefined;
        }
        for(const component of other.components){
            const result = this.shape.colidesWith(this, component)
            if(result){
                return component;
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

    checkCannonballColission(cannonball: Cannonball) {
        const distance = getDistance(this.position, cannonball.position);
        const bb = this.shape.getBoundingBox(this)
        if(distance > Math.max(bb.width, bb.height)){
            return;
        }
        const cannonBallLine: Line = [
            {x: cannonball.position.x - cannonball.velocity.x, y: cannonball.position.y - cannonball.velocity.y},
            {x: cannonball.position.x, y: cannonball.position.y},
        ]

        const polygon: Polygon = this.shape.getPolygon(this);
        if(!doPolygonsIntersect(polygon, cannonBallLine)) return
   
        this.impulses.push({
            x: cannonball.velocity.x * CANNONBALL_KNOCKBACK,
            y: cannonball.velocity.y  * CANNONBALL_KNOCKBACK,
            offsetX: cannonball.position.x - this.position.x,
            offsetY: cannonball.position.y - this.position.y
        });


        this.level.removeCannonball(cannonball);
    }
}

interface ObsticalShape{
    getPolygon(o: Obstical): Polygon;
    colidesWith(o: Obstical, c: Component): boolean;
    getBoundingBox(o: Obstical): BoundingBox
}

export class RectangleObsticalShape implements ObsticalShape {
    readonly width: number
    readonly height: number;
    constructor(w:number, h:number){
        this.width = w
        this.height = h
    }
    getPolygon(o: Obstical): Polygon {
        return rectangleToPolygon(this.getBoundingBox(o))
    }
    colidesWith(o: Obstical, c: Component): boolean {
        return doRectanglesIntersect(this.getBoundingBox(o), c.getBoundingBox())
    }
    getBoundingBox(o: Obstical): BoundingBox {
        return {
            position: o.position,
            angle: o.angle,
            width: this.width,
            height: this.height
        }
    }
    
}