import { ObjectInfo } from "./gameState";

export type Coord = { x: number, y: number };

export type Input = {
    x: number;
    y: number;
}


export function updateVelocityFromInput(delta:number, obj: ObjectInfo, input: Input) {
    const accel = obj.accel || 0;

    const normalizedInput = {
        x: input.x / Math.sqrt(input.x*input.x + input.y*input.y),
        y: input.y / Math.sqrt(input.x*input.x + input.y*input.y)
    }

    if(normalizedInput.x) obj.vel.x += delta * accel * normalizedInput.x;
    if(normalizedInput.y) obj.vel.y += delta * accel * normalizedInput.y;
}

export function updatePhysics(delta: number, obj:ObjectInfo) {
    const friction = obj.friction || 0;
    const frictionX = delta * friction * (obj.vel.x);
    const frictionY = delta * friction * (obj.vel.y);

    obj.vel.x -= frictionX;
    obj.vel.y -= frictionY;

    obj.pos.x += obj.vel.x * delta;
    obj.pos.y += obj.vel.y * delta;
}