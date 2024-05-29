import { Line } from "./Polygon";

export default interface Vector2 {
    x: number;
    y: number;
}

export function dot(a: Vector2, b: Vector2) {
    return a.x * b.x + a.y * b.y;
}

export function getMagnitude(a: Vector2) {
    return Math.sqrt(dot(a, a));
}

export function getDistance(a: Vector2, b: Vector2) {
    return getMagnitude({
        x: a.x - b.x,
        y: a.y - b.y
    });
}

export function getNormalized(a: Vector2) {
    const len = getMagnitude(a);
    return {
        x: a.x / len,
        y: a.y / len
    };
}

export function add(a: Vector2, b: Vector2) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    };
}

export function sub(a: Vector2, b: Vector2) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

export function mul(a: Vector2, b: Vector2) {
    return {
        x: a.x * b.x,
        y: a.y * b.y
    };
}

export function div(a: Vector2, b: Vector2) {
    return {
        x: a.x / b.x,
        y: a.y / b.y
    };
}

export function scale(a: Vector2, b: number) {
    return {
        x: a.x * b,
        y: a.y * b
    };
}

export function rotate(a: Vector2, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
        x: a.x * cos - a.y * sin,
        y: a.x * sin + a.y * cos
    };
}

export function distance(a: Vector2, b: Vector2) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(a: Vector2, b: Vector2) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

export function getLinearVelocityFromAngularVelocity({
    angularVelocity,
    radius,
    angle
}:{
    angularVelocity: number;
    radius: number;
    angle: number;
}) {
    return {
        x: angularVelocity * radius * Math.sin(angle + Math.PI / 2),
        y: angularVelocity * radius * Math.cos(angle + Math.PI / 2)
    };
}


export function normalizeAngle(angle: number) {
    const a = (angle + Math.PI * 2) % (Math.PI * 2);
    if( a > 0) return a;
    return a + Math.PI * 2;
}

/*
static func lerp_angle(a, b, t):
    if abs(a-b) >= PI:
        if a > b:
            a = normalize_angle(a) - 2.0 * PI
        else:
            b = normalize_angle(b) - 2.0 * PI
    return lerp(a, b, t)
*/

export function lerpAngle(a:number, b:number, t:number){
    if(Math.abs(a-b) >= Math.PI){
        if(a > b){
            a = normalizeAngle(a) - 2.0 * Math.PI;
        }else{
            b = normalizeAngle(b) - 2.0 * Math.PI;
        }
    }
    return normalizeAngle(lerp(a, b, t));
}

export function lerp(a:number, b:number, t:number){
    return a + (b - a) * t;
}


export function findShortestDistanceBetweenTwoMovingObjects(aPos: Vector2, aVel: Vector2, bPos:Vector2, bVel: Vector2): number|null {
    const pos = sub(bPos, aPos);
    const vel = sub(bVel, aVel);

    const distanceSquared = (t: number)=> getMagnitude({
        x: pos.x + vel.x * t,
        y: pos.y + vel.y * t
    })
    
    const t = -1 * (pos.x * vel.x + pos.y * vel.y) / (vel.x * vel.x + vel.y * vel.y);
    
    if(t < 0){
        return null;
    }
    const shortestDistanceSquared = distanceSquared(t);
    return Math.sqrt(shortestDistanceSquared);
}

export function reflect(velocity: Vector2, surface: Line): Vector2 {
    const [start, end] = surface;
    const surfaceVector = sub(end, start);
    const surfaceNormal = getNormalized(rotate(surfaceVector, Math.PI / 2));
    
    const dotProduct = dot(velocity, surfaceNormal);
    const reflectionVector = sub(velocity, scale(surfaceNormal, 2 * dotProduct));
    
    return reflectionVector;
}
export function isInCircle(point: Vector2, center: Vector2, radius: number): boolean {
    const distanceSquared = distanceSq(point, center);
    return distanceSquared <= radius * radius;
}